using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Timers;
using Telegram.Bot;
using Telegram.Bot.Exceptions;
using Telegram.Bot.Polling;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;
using Telegram.Bot.Types.ReplyMarkups;
using File = System.IO.File;
using Polly;
using Polly.Extensions.Http;

namespace TelegramReferralBot;

public class Program
{
    // Bot client
    public static ITelegramBotClient BotClient = null!;
    
    // Data dictionaries
    public static Dictionary<string, bool> ShowWelcome { get; set; } = new();
    public static Dictionary<string, string> RefLinks { get; set; } = new();
    public static Dictionary<string, int> PasswordAttempts { get; set; } = new();
    public static Dictionary<string, Dictionary<string, int>> UserActivity { get; set; } = new();
    public static Dictionary<string, string> ReferredBy { get; set; } = new();
    public static Dictionary<string, int> PointTotals { get; set; } = new();
    public static Dictionary<string, int> UserPointOffset { get; set; } = new();
    public static Dictionary<string, int> PointsByReferrer { get; set; } = new();
    public static Dictionary<int, string> JoinedReferrals { get; set; } = new();
    public static Dictionary<string, int> ReferralPoints { get; set; } = new();
    public static Dictionary<int, Dictionary<string, string>> InteractedUser { get; set; } = new();
    public static List<string> CampaignDays { get; set; } = new();
    public static List<string> DisableNotice { get; set; } = new();
    
    // Other fields
    private static User _bot = null!;
    private static readonly List<string> _awaitingReply = new();
    private static readonly CancellationTokenSource _cts = new();
    private static readonly char[] _chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".ToCharArray();
    private static System.Timers.Timer? _apiSyncTimer;

    public static async Task Main(string[] args)
    {
        // Check if we should run tests
        if (args.Length > 0 && args[0].ToLower() == "test")
        {
            await RunTests();
            return;
        }
        
        try
        {
            // Load configuration
            LoadData.LoadConf();
            
            // Make sure there are no active webhooks
            await ClearWebhook();
            
            // Initialize bot client with retry handler
            var httpClient = new HttpClient()
            {
                Timeout = TimeSpan.FromSeconds(30) // Increase timeout to 30 seconds
            };
            
            // Create a retry policy for the Telegram Bot client
            var retryPolicy = Policy
                .Handle<HttpRequestException>()
                .Or<TaskCanceledException>() // This handles timeouts
                .Or<TimeoutException>()
                .WaitAndRetryAsync(
                    5, // Number of retries
                    retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)), // Exponential backoff
                    onRetry: (exception, timeSpan, retryCount, context) =>
                    {
                        string message = $"Request attempt {retryCount} failed with {exception.GetType().Name}: {exception.Message}. Retrying in {timeSpan.TotalSeconds} seconds...";
                        Logging.AddToLog(message);
                        Console.WriteLine(message);
                    }
                );
            
            // Create the bot client with the HTTP client
            BotClient = new TelegramBotClient(Config.BotAccessToken, httpClient);
            
            // Get bot info
            _bot = await retryPolicy.ExecuteAsync(async () => await BotClient.GetMeAsync());
            Console.WriteLine($"I am user {_bot.Id} and my name is {_bot.FirstName}.");
            Console.WriteLine("Bot successfully connected to Telegram API.");
            
            // Set up timer for hourly data backup
            System.Timers.Timer timer = new(3600000); // 1 hour
            timer.Elapsed += TimerElapsed;
            timer.Enabled = true;
            timer.Start();
            
            // Set up API sync timer (sync every 15 minutes)
            _apiSyncTimer = new System.Timers.Timer(15 * 60 * 1000); // 15 minutes
            _apiSyncTimer.Elapsed += async (sender, e) => await ApiIntegration.SyncReferralsAsync();
            _apiSyncTimer.AutoReset = true;
            _apiSyncTimer.Start();

            Console.WriteLine("API sync timer started. Will sync with backend every 15 minutes.");
            
            // Set up message handling with more conservative settings
            var receiverOptions = new ReceiverOptions
            {
                AllowedUpdates = new[] { UpdateType.Message, UpdateType.CallbackQuery },
                ThrowPendingUpdates = true,
                Limit = 100,
            };
            
            Console.WriteLine("Starting to receive messages...");
            // Start receiving messages
            BotClient.StartReceiving(
                updateHandler: HandleUpdateAsync,
                pollingErrorHandler: HandlePollingErrorAsync,
                receiverOptions: receiverOptions,
                cancellationToken: _cts.Token
            );
            
            Console.WriteLine("Bot is running. Press Ctrl+C to exit.");
            // Keep the application running
            await Task.Delay(Timeout.Infinite, _cts.Token);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Critical error in Main: {ex.Message}");
            Console.WriteLine(ex.StackTrace);
        }
    }
    
    /// <summary>
    /// Clears any existing webhook to avoid conflicts
    /// </summary>
    private static async Task ClearWebhook()
    {
        try
        {
            // Create a retry policy for the webhook clearing
            var retryPolicy = Policy
                .Handle<HttpRequestException>()
                .Or<TaskCanceledException>() // This handles timeouts
                .Or<TimeoutException>()
                .WaitAndRetryAsync(
                    3, // Number of retries
                    retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)), // Exponential backoff
                    onRetry: (exception, timeSpan, retryCount, context) =>
                    {
                        string message = $"Webhook clearing attempt {retryCount} failed with {exception.GetType().Name}: {exception.Message}. Retrying in {timeSpan.TotalSeconds} seconds...";
                        Logging.AddToLog(message);
                        Console.WriteLine(message);
                    }
                );
            
            // Use a temporary client with retry policy
            var tempClient = new TelegramBotClient(Config.BotAccessToken);
            await retryPolicy.ExecuteAsync(async () => await tempClient.DeleteWebhookAsync());
            Console.WriteLine("Webhook cleared successfully.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error clearing webhook: {ex.Message}");
            Logging.AddToLog($"Error clearing webhook: {ex.Message}");
        }
    }
    
    /// <summary>
    /// Run the test suite
    /// </summary>
    private static async Task RunTests()
    {
        await TestRunner.RunTests();
    }
    
    /// <summary>
    /// Handles timer elapsed event for data backup
    /// </summary>
    private static void TimerElapsed(object? sender, ElapsedEventArgs e)
    {
        string now = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        string filename = "Datafile-" + now + ".txt";
        string folder = Path.Combine(Config.OutputFilePath, "Logs");
        string file = Path.Combine(folder, filename);
        
        // Create logs directory if it doesn't exist
        if (!Directory.Exists(folder))
        {
            Directory.CreateDirectory(folder);
        }
        
        // Dump current data into log
        try
        {
            using (StreamWriter sw = File.AppendText(file))
            {
                sw.WriteLine("userActivity=");
                string data = "";
                foreach (var entry in UserActivity)
                {
                    data = entry.Key;
                    foreach (var line in entry.Value)
                    {
                        data += "?" + line.Key + "&" + line.Value.ToString();
                    }
                    sw.WriteLine(data);
                }
            }

            using (StreamWriter sw = File.AppendText(file))
            {
                sw.WriteLine("refLinks=");
                foreach (var entry in RefLinks)
                {
                    sw.WriteLine(entry.Key + "?" + entry.Value);
                }
            }

            using (StreamWriter sw = File.AppendText(file))
            {
                sw.WriteLine("passwordAttempts=");
                foreach (var entry in PasswordAttempts)
                {
                    sw.WriteLine(entry.Key + "?" + entry.Value.ToString());
                }
            }

            using (StreamWriter sw = File.AppendText(file))
            {
                sw.WriteLine("showWelcome=");
                foreach (var entry in ShowWelcome)
                {
                    sw.WriteLine(entry.Key + "?" + entry.Value);
                }
            }

            using (StreamWriter sw = File.AppendText(file))
            {
                sw.WriteLine("referredBy=");
                foreach (var entry in ReferredBy)
                {
                    sw.WriteLine(entry.Key + "?" + entry.Value);
                }
            }

            using (StreamWriter sw = File.AppendText(file))
            {
                sw.WriteLine("groupChatIdNumber=");
                sw.WriteLine(Config.GroupChatIdNumber.ToString());
            }

            using (StreamWriter sw = File.AppendText(file))
            {
                sw.WriteLine("pointsByReferrer=");
                foreach (var entry in PointsByReferrer)
                {
                    sw.WriteLine(entry.Key + "?" + entry.Value.ToString());
                }
            }

            using (StreamWriter sw = File.AppendText(file))
            {
                sw.WriteLine("userPointOffset=");
                foreach (var entry in UserPointOffset)
                {
                    sw.WriteLine(entry.Key + "?" + entry.Value.ToString());
                }
            }

            using (StreamWriter sw = File.AppendText(file))
            {
                sw.WriteLine("joinedReferrals=");
                foreach (var entry in JoinedReferrals)
                {
                    sw.WriteLine(entry.Key.ToString() + "?" + entry.Value);
                }
            }

            using (StreamWriter sw = File.AppendText(file))
            {
                sw.WriteLine("referralPoints=");
                foreach (var entry in ReferralPoints)
                {
                    sw.WriteLine(entry.Key + "?" + entry.Value.ToString());
                }
            }

            using (StreamWriter sw = File.AppendText(file))
            {
                sw.WriteLine("interactedUser=");
                foreach (var entry in InteractedUser)
                {
                    string result = entry.Key.ToString() + "?????";
                    foreach (var value in entry.Value)
                    {
                        result += "&&&&&" + value.Key + "#####" + value.Value;
                    }
                    sw.WriteLine(result);
                }
            }

            using (StreamWriter sw = File.AppendText(file))
            {
                sw.WriteLine("disableNotice=");
                string data = "";
                foreach (string entry in DisableNotice)
                {
                    data += entry + "?";
                }
                sw.WriteLine(data);
            }
        }
        catch (Exception ex)
        {
            string text = $"Error in timer_Elapsed: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
        }
    }
    
    /// <summary>
    /// Handles incoming updates from Telegram
    /// </summary>
    private static async Task HandleUpdateAsync(ITelegramBotClient botClient, Update update, CancellationToken cancellationToken)
    {
        try
        {
            // Only process Message updates
            if (update.Message is not { } message)
                return;
            
            // Only process text messages
            if (message.Text is not { } messageText)
                return;
            
            var chatId = message.Chat.Id;
            var userId = message.From?.Id.ToString() ?? "unknown";
            
            Console.WriteLine($"Received a '{messageText}' message in chat {chatId} from user {userId}.");
            
            // Process the message
            await ProcessMessageAsync(message, cancellationToken);
        }
        catch (Exception ex)
        {
            string text = $"Error in HandleUpdateAsync: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
        }
    }
    
    /// <summary>
    /// Handles polling errors
    /// </summary>
    private static async Task HandlePollingErrorAsync(ITelegramBotClient botClient, Exception exception, CancellationToken cancellationToken)
    {
        var errorMessage = exception switch
        {
            ApiRequestException apiRequestException => $"Telegram API Error:\n[{apiRequestException.ErrorCode}]\n{apiRequestException.Message}",
            HttpRequestException httpException => $"HTTP Request Error: {httpException.Message}\nThis may be due to network connectivity issues.",
            TaskCanceledException => "Request timed out. This may be due to network connectivity issues.",
            _ => $"Unhandled error: {exception.GetType().Name} - {exception.Message}"
        };

        Console.WriteLine(errorMessage);
        
        // For specific errors that might be temporary, we can try to reconnect
        if (exception is HttpRequestException || exception is TaskCanceledException || 
            (exception is ApiRequestException apiEx && (apiEx.ErrorCode == 409 || apiEx.ErrorCode == 429)))
        {
            Console.WriteLine("Connection issue detected. Waiting 5 seconds before attempting to reconnect...");
            
            try
            {
                // Wait a bit before reconnecting
                await Task.Delay(5000, cancellationToken);
                
                if (!cancellationToken.IsCancellationRequested)
                {
                    // Clear any webhooks that might be interfering
                    await ClearWebhook();
                    
                    Console.WriteLine("Attempting to restart receiving updates...");
                    
                    // Set up message handling with more conservative settings
                    var receiverOptions = new ReceiverOptions
                    {
                        AllowedUpdates = new[] { UpdateType.Message, UpdateType.CallbackQuery },
                        ThrowPendingUpdates = true,
                        Limit = 50,
                    };
                    
                    // Restart receiving
                    botClient.StartReceiving(
                        updateHandler: HandleUpdateAsync,
                        pollingErrorHandler: HandlePollingErrorAsync,
                        receiverOptions: receiverOptions,
                        cancellationToken: cancellationToken
                    );
                    
                    Console.WriteLine("Bot reconnected and is receiving updates again.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to reconnect: {ex.Message}");
            }
        }
    }
    
    /// <summary>
    /// Process incoming messages
    /// </summary>
    private static async Task ProcessMessageAsync(Message message, CancellationToken cancellationToken)
    {
        await MessageProcessor.ProcessMessageAsync(message, cancellationToken);
    }
    
    /// <summary>
    /// Creates a user activity dictionary for a user
    /// </summary>
    public static Dictionary<string, int>? CreateUserActivityDictionary(string userId)
    {
        Logging.AddToLog("Creating user activity dictionary for " + userId);
        
        if (UserActivity.ContainsKey(userId))
        {
            Logging.AddToLog("User activity dictionary already exists for " + userId);
            return UserActivity[userId];
        }
        else
        {
            Dictionary<string, int> perDay = new();
            
            if (DateTime.TryParse(Config.StartDate, out DateTime startDate))
            {
                for (int i = 0; i < Config.NumberOfDays; i++)
                {
                    DateTime dateTime = startDate.AddDays(i);
                    string date = dateTime.ToString("MM/dd/yyyy");
                    perDay.Add(date, 0);
                }
                
                UserActivity.Add(userId, perDay);
                Logging.AddToLog("Added new user activity dictionary for " + userId);
                
                bool saved = SaveMethods.SaveUserActivity();
                if (saved)
                {
                    string message = "UserActivity saved.";
                    Logging.AddToLog(message);
                    Console.WriteLine(message);
                    return UserActivity[userId];
                }
                else
                {
                    string message = "Error! UserActivity not saved.";
                    Logging.AddToLog(message);
                    Console.WriteLine(message);
                    return null;
                }
            }
            else
            {
                string message = "Error parsing start date.";
                Logging.AddToLog(message);
                Console.WriteLine(message);
                return null;
            }
        }
    }
    
    /// <summary>
    /// Generates or retrieves a referral link for a user
    /// </summary>
    public static string GetRefLink(User user)
    {
        Logging.AddToLog("Getting reflink for " + user.Id.ToString());
        
        string userId = user.Id.ToString();
        
        // Check if user already has a referral link
        if (RefLinks.ContainsKey(userId))
        {
            Logging.AddToLog("Reflink already exists for " + userId);
            string link = Config.LinkToBot + "?start=" + RefLinks[userId];
            return "Exists?" + link;
        }
        else
        {
            // Generate a new referral link
            var inputBytes = Encoding.UTF8.GetBytes(userId);
            
            // Special "url-safe" base64 encode
            string base64String = Convert.ToBase64String(inputBytes)
                .Replace('+', '-') // replace URL unsafe characters with safe ones
                .Replace('/', '_') // replace URL unsafe characters with safe ones
                .Replace("=", ""); // no padding
            
            // Check if this base64 string is already used
            if (RefLinks.Values.Contains(base64String))
            {
                // Generate a random string instead
                byte[] randomBytes = new byte[8];
                using var rng = RandomNumberGenerator.Create();
                rng.GetBytes(randomBytes);
                
                base64String = Convert.ToBase64String(randomBytes)
                    .Replace('+', '-')
                    .Replace('/', '_')
                    .Replace("=", "");
            }
            
            // Add to dictionary and save
            RefLinks.Add(userId, base64String);
            bool saved = SaveMethods.SaveRefLinks();
            
            if (saved)
            {
                string message = "RefLinks saved.";
                Logging.AddToLog(message);
                Console.WriteLine(message);
            }
            else
            {
                string message = "Error! RefLinks not saved.";
                Logging.AddToLog(message);
                Console.WriteLine(message);
            }
            
            string link = Config.LinkToBot + "?start=" + base64String;
            return link;
        }
    }
    
    /// <summary>
    /// Updates Point totals for all users
    /// </summary>
    public static void UpdatePointTotals()
    {
        Logging.AddToLog("Updating Point totals");
        
        // Clear current Point totals
        PointsByReferrer.Clear();
        
        // Add Points from referrals
        foreach (var entry in ReferralPoints)
        {
            PointsByReferrer[entry.Key] = entry.Value;
        }
        
        // Add Points from user activity
        foreach (var referralEntry in ReferredBy)
        {
            string referredId = referralEntry.Key;
            string referrerId = referralEntry.Value;
            
            // Skip if user doesn't have activity
            if (!UserActivity.ContainsKey(referredId))
                continue;
            
            // Get today's date
            string today = DateTime.UtcNow.ToString("MM/dd/yyyy");
            
            // Skip if no activity today
            if (!UserActivity[referredId].ContainsKey(today))
                continue;
            
            int activityCount = UserActivity[referredId][today];
            int pointsToAdd = Math.Min(activityCount, Config.MaxPointsPerDay);
            
            // Add Points to referrer
            if (PointsByReferrer.ContainsKey(referrerId))
            {
                PointsByReferrer[referrerId] += pointsToAdd;
            }
            else
            {
                PointsByReferrer[referrerId] = pointsToAdd;
            }
        }
        
        // Apply Point offsets
        foreach (var offset in UserPointOffset)
        {
            string userId = offset.Key;
            int offsetValue = offset.Value;
            
            // Skip if offset is 0
            if (offsetValue == 0)
                continue;
            
            if (PointsByReferrer.ContainsKey(userId))
            {
                PointsByReferrer[userId] += offsetValue;
            }
            else
            {
                PointsByReferrer[userId] = offsetValue;
            }
        }
        
        // Remove banned users
        foreach (var entry in UserPointOffset)
        {
            // Skip if not banned
            if (entry.Value >= 0)
                continue;
            
            string bannedUserId = entry.Key;
            
            if (PointsByReferrer.ContainsKey(bannedUserId))
            {
                PointsByReferrer.Remove(bannedUserId);
            }
        }
        
        // Save Points
        if (PointsByReferrer.Any())
        {
            bool saved = SaveMethods.SavePointsByReferrer();
            if (saved)
            {
                string text = "PointsByReferrer was saved.";
                Logging.AddToLog(text);
            }
        }
    }
    
    /// <summary>
    /// Checks if a password is valid for admin access
    /// </summary>
    public static string CheckPassword(string text, string userId)
    {
        string message = "Beginning check password.";
        Logging.AddToLog(message);
        Console.WriteLine(message);
        
        try
        {
            int attempts = 0;
            if (PasswordAttempts.ContainsKey(userId))
            {
                attempts = PasswordAttempts[userId];
            }
            
            // Check if user is banned from admin access
            if (attempts >= 11)
            {
                return null;
            }
            
            // Check password
            if (text != Config.AdminPassword)
            {
                attempts++;
                
                if (PasswordAttempts.ContainsKey(userId))
                {
                    PasswordAttempts[userId] = attempts;
                }
                else
                {
                    PasswordAttempts.Add(userId, attempts);
                }
                
                bool saved = SaveMethods.SavePasswordAttempts();
                if (saved)
                {
                    string text1 = "PasswordAttempts was saved.";
                    Logging.AddToLog(text1);
                    Console.WriteLine(text1);
                }
                else
                {
                    string text1 = "Could not save passwordAttempts.";
                    Logging.AddToLog(text1);
                    Console.WriteLine(text1);
                }
                
                if (attempts < 10)
                {
                    return "wrong_" + attempts.ToString();
                }
                else if (attempts == 11)
                {
                    return "banned";
                }
                else
                {
                    return null;
                }
            }
            else
            {
                // Password is correct, mark user as admin
                if (PasswordAttempts.ContainsKey(userId))
                {
                    PasswordAttempts[userId] = -1; // -1 indicates confirmed admin
                }
                else
                {
                    PasswordAttempts.Add(userId, -1);
                }
                
                SaveMethods.SavePasswordAttempts();
                return "confirmed";
            }
        }
        catch (Exception ex)
        {
            string errorMessage = $"Error in CheckPassword: {ex.Message}";
            Logging.AddToLog(errorMessage);
            Console.WriteLine(errorMessage);
            return null;
        }
    }
    
    /// <summary>
    /// List of users awaiting a reply (for password verification)
    /// </summary>
    public static List<string> AwaitingReply => _awaitingReply;
}
