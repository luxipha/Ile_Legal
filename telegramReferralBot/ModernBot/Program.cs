using System;
using System.Net;
using System.Text;
using System.Timers;
using Telegram.Bot;
using Telegram.Bot.Exceptions;
using Telegram.Bot.Polling;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;
using Telegram.Bot.Types.ReplyMarkups;
using System.Security.Cryptography;
using Polly;
using Polly.Extensions.Http;
using System.Globalization;
using File = System.IO.File;
using TelegramReferralBot.Services;
using TelegramReferralBot.Models;

namespace TelegramReferralBot;

class Program
{
    // Static variables
    public static TelegramBotClient BotClient = null!;
    private static readonly CancellationTokenSource _cts = new();
    private static System.Timers.Timer _apiSyncTimer = null!;
    private static readonly List<string> _awaitingReply = new();
    private static int _networkErrorRetryCount = 0;
    private static readonly HashSet<int> _recentlyProcessedMessageIds = new HashSet<int>();
    private static readonly object _messageIdsLock = new object();
    private static DateTime _lastUpdateTime = DateTime.MinValue;
    private static HttpListener _listener = null!;
    private static readonly char[] _chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".ToCharArray();
    
    // MongoDB service
    public static MongoDbService? MongoDb { get; private set; }
    
    // Data dictionaries
    public static Dictionary<string, bool> ShowWelcome { get; set; } = new();
    public static Dictionary<string, string> RefLinks { get; set; } = new();
    public static Dictionary<string, int> PasswordAttempts { get; set; } = new();
    public static Dictionary<string, Dictionary<string, int>> UserActivity { get; set; } = new();
    public static Dictionary<string, string> ReferredBy { get; set; } = new();
    public static Dictionary<string, int> PointTotals { get; set; } = new();
    public static Dictionary<string, int> UserPointOffset { get; set; } = new();
    public static Dictionary<string, int> PointsByReferrer { get; set; } = new();
    public static Dictionary<string, bool> JoinedReferrals { get; set; } = new();
    public static Dictionary<string, int> ReferralPoints { get; set; } = new();
    public static Dictionary<int, Dictionary<string, string>> InteractedUser { get; set; } = new();
    public static List<string> CampaignDays { get; set; } = new();
    public static List<string> DisableNotice { get; set; } = new();

    public static async Task Main(string[] args)
    {
        try
        {
            Console.WriteLine("Starting bot...");
            Logging.AddToLog("Bot starting...");
            
            // Load configuration from environment variables
            LoadData.LoadFromEnvironment();
            
            string path = Directory.GetCurrentDirectory();
            Console.WriteLine($"Found path: {path}");
            
            // Initialize MongoDB service
            try
            {
                // Debug logging for MongoDB configuration
                Console.WriteLine($"DEBUG: MongoDB Connection String: {(string.IsNullOrEmpty(Config.MongoDbConnectionString) ? "Not found" : "Found (length: " + Config.MongoDbConnectionString.Length + ")")}");
                Console.WriteLine($"DEBUG: MongoDB Database Name: {(string.IsNullOrEmpty(Config.MongoDbDatabaseName) ? "Not found" : Config.MongoDbDatabaseName)}");
                
                // Add fallback MongoDB connection string if not found in config
                if (string.IsNullOrEmpty(Config.MongoDbConnectionString))
                {
                    Config.MongoDbConnectionString = "mongodb+srv://Ile-admin:EQ3fMy8uu@clusterile.aqtxsry.mongodb.net/ileDB?retryWrites=true&w=majority";
                    Console.WriteLine("Using fallback MongoDB connection string");
                }
                
                // Set default database name if not found in config
                if (string.IsNullOrEmpty(Config.MongoDbDatabaseName))
                {
                    Config.MongoDbDatabaseName = "ileDB";
                    Console.WriteLine("Using fallback MongoDB database name: ileDB");
                }
                
                if (string.IsNullOrEmpty(Config.MongoDbConnectionString) || string.IsNullOrEmpty(Config.MongoDbDatabaseName))
                {
                    Console.WriteLine("MongoDB connection string or database name not found in config or environment variables. Using file storage as fallback.");
                    Logging.AddToLog("MongoDB connection string or database name not found in config or environment variables. Using file storage as fallback.");
                }
                else
                {
                    Console.WriteLine($"Initializing MongoDB connection with database: {Config.MongoDbDatabaseName}...");
                    Logging.AddToLog($"Initializing MongoDB connection with database: {Config.MongoDbDatabaseName}...");
                    
                    // Create MongoDB service instance
                    MongoDb = new MongoDbService(Config.MongoDbConnectionString, Config.MongoDbDatabaseName);
                    
                    // Test connection by getting a document count
                    var isConnected = await MongoDb.TestConnectionAsync();
                    if (isConnected)
                    {
                        Console.WriteLine("MongoDB connection initialized successfully.");
                        Logging.AddToLog("MongoDB connection initialized successfully.");
                        
                        // Load data from MongoDB
                        await LoadDataFromMongoDbAsync();
                    }
                    else
                    {
                        Console.WriteLine("Failed to connect to MongoDB. Using file storage as fallback.");
                        Logging.AddToLog("Failed to connect to MongoDB. Using file storage as fallback.");
                        MongoDb = null;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error initializing MongoDB: {ex.Message}");
                Logging.AddToLog($"Error initializing MongoDB: {ex.Message}");
                Console.WriteLine("Using file storage as fallback.");
                Logging.AddToLog("Using file storage as fallback.");
            }
            
            // Initialize bot client with maximum resilience to network issues
            var httpClientHandler = new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback = (sender, cert, chain, sslPolicyErrors) => true
            };
            
            var httpClient = new HttpClient(new SuperRetryHandler(httpClientHandler))
            {
                Timeout = TimeSpan.FromMinutes(2)
            };
            
            BotClient = new TelegramBotClient(Config.BotAccessToken, httpClient);
            
            // Get bot info to verify connection
            var me = await BotClient.GetMeAsync();
            Console.WriteLine($"Bot successfully connected to Telegram API.");
            Console.WriteLine($"Bot Name: {me.FirstName}");
            Console.WriteLine($"Bot Username: @{me.Username}");
            Console.WriteLine($"Bot ID: {me.Id}");
            
            // Update Config.LinkToBot to use the bot's username
            Config.LinkToBot = $"https://telegram.me/{me.Username}";
            Console.WriteLine($"Using referral link format: {Config.LinkToBot}?start=XXXXX");
            
            Logging.AddToLog($"Bot successfully connected to Telegram API. Name: {me.FirstName}, Username: @{me.Username}, ID: {me.Id}");
            Logging.AddToLog($"Using referral link format: {Config.LinkToBot}?start=XXXXX");
            
            // Test API connection to backend
            Console.WriteLine("Testing connection to backend API...");
            Logging.AddToLog("Testing connection to backend API...");
            await ApiIntegration.TestApiConnectionAsync();
            
            // Start API sync timer
            StartApiSyncTimer();
            
            // Start MongoDB save timer
            StartMongoDbSaveTimer();
            
            // Start the health check server
            StartHealthCheckServer();
            
            // Set up polling with retry logic
            var receiverOptions = new ReceiverOptions
            {
                AllowedUpdates = new[] { UpdateType.Message, UpdateType.CallbackQuery },
                ThrowPendingUpdates = true,
                Limit = 100
            };
            
            // Start receiving updates
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
            Console.WriteLine($"Startup error: {ex.Message}");
            Logging.AddToLog($"Startup error: {ex.Message}");
            
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                Logging.AddToLog($"Inner exception: {ex.InnerException.Message}");
            }
        }
    }
    
    private static void StartHealthCheckServer()
    {
        try
        {
            _listener = new HttpListener();
            _listener.Prefixes.Add("http://+:8080/");
            _listener.Start();
            
            Logging.AddToLog("Started health check server on port 8080");
            
            // Start a thread to handle health check requests
            new Thread(() =>
            {
                while (_listener.IsListening)
                {
                    try
                    {
                        // Wait for a request
                        HttpListenerContext context = _listener.GetContext();
                        HttpListenerRequest request = context.Request;
                        HttpListenerResponse response = context.Response;
                        
                        // Log the request
                        Logging.AddToLog($"Received request: {request.HttpMethod} {request.Url.PathAndQuery}");
                        
                        // Handle health check endpoint
                        if (request.Url.PathAndQuery == "/health" || request.Url.PathAndQuery == "/")
                        {
                            string responseString = "OK - IleRefer Bot is running";
                            byte[] buffer = Encoding.UTF8.GetBytes(responseString);
                            
                            response.ContentLength64 = buffer.Length;
                            response.StatusCode = 200;
                            Stream output = response.OutputStream;
                            output.Write(buffer, 0, buffer.Length);
                            output.Close();
                            
                            Logging.AddToLog("Health check request successful");
                        }
                        else
                        {
                            response.StatusCode = 404;
                            response.Close();
                        }
                    }
                    catch (Exception ex)
                    {
                        Logging.AddToLog($"Error handling health check request: {ex.Message}");
                    }
                }
            }).Start();
        }
        catch (Exception ex)
        {
            Logging.AddToLog($"Failed to start health check server: {ex.Message}");
        }
    }
    
    /// <summary>
    /// Clears any existing webhook to avoid conflicts
    /// </summary>
    private static async Task ClearWebhook(ITelegramBotClient botClient)
    {
        try
        {
            await botClient.DeleteWebhookAsync(dropPendingUpdates: true);
            Logging.AddToLog("Webhook cleared successfully.");
        }
        catch (Exception ex)
        {
            Logging.AddToLog($"Error clearing webhook: {ex.Message}");
            throw; // Rethrow to be handled by the calling method
        }
    }
    
    /// <summary>
    /// Handles incoming updates from Telegram
    /// </summary>
    private static async Task HandleUpdateAsync(ITelegramBotClient botClient, Update update, CancellationToken cancellationToken)
    {
        try
        {
            // Extract the message from the update
            Message? message = update.Message;
            
            if (update.Type == UpdateType.CallbackQuery)
            {
                if (update.CallbackQuery != null)
                {
                    await MessageProcessor.ProcessCallbackQueryAsync(update.CallbackQuery, cancellationToken);
                }
                return;
            }
            
            if (message == null)
                return;
            
            // Deduplicate messages by ID to prevent processing the same message multiple times
            bool isDuplicate = false;
            lock (_messageIdsLock)
            {
                if (_recentlyProcessedMessageIds.Contains(message.MessageId))
                {
                    isDuplicate = true;
                    Logging.AddToLog($"Skipping duplicate message ID: {message.MessageId}");
                }
                else
                {
                    _recentlyProcessedMessageIds.Add(message.MessageId);
                    if (_recentlyProcessedMessageIds.Count > 1000)
                    {
                        _recentlyProcessedMessageIds.Clear();
                        Logging.AddToLog("Cleared message ID cache (exceeded limit)");
                    }
                }
            }
            
            if (isDuplicate)
                return;
            
            // Process the message
            await ProcessMessageAsync(message, cancellationToken);
            _lastUpdateTime = DateTime.UtcNow;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error handling update: {ex.Message}");
            Logging.AddToLog($"Error handling update: {ex.Message}");
        }
    }
    
    /// <summary>
    /// Processes a message from Telegram
    /// </summary>
    private static async Task ProcessMessageAsync(Message message, CancellationToken cancellationToken)
    {
        try
        {
            if (message.From == null)
                return;
            
            string? messageText = message.Text;
            if (string.IsNullOrEmpty(messageText))
                return;
            
            // Log the message
            string userId = message.From.Id.ToString();
            string username = message.From.Username ?? "Unknown";
            Logging.AddToLog($"Message from {username} ({userId}): {messageText}");
            
            // Process the message with the message processor
            await MessageProcessor.ProcessMessageAsync(message, cancellationToken);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error processing message: {ex.Message}");
            Logging.AddToLog($"Error processing message: {ex.Message}");
        }
    }
    
    /// <summary>
    /// Handles errors that occur during polling
    /// </summary>
    private static async Task HandlePollingErrorAsync(ITelegramBotClient botClient, Exception exception, CancellationToken cancellationToken)
    {
        var errorMessage = exception switch
        {
            ApiRequestException apiRequestException => $"Telegram API Error:\n[{apiRequestException.ErrorCode}]\n{apiRequestException.Message}",
            _ => exception.ToString()
        };

        Logging.AddToLog(errorMessage);

        // Handle specific error codes
        if (exception is ApiRequestException apiEx && apiEx.ErrorCode == 409)
        {
            Logging.AddToLog("Conflict detected. Waiting longer to allow other instances to time out...");
            await Task.Delay(60000, cancellationToken); // Wait a full minute
            await ClearWebhook(botClient);
            Logging.AddToLog("Attempting to restart receiving updates after conflict...");
            return;
        }

        if (exception is HttpRequestException || exception is TaskCanceledException ||
            (exception is ApiRequestException apiEx2 && (apiEx2.ErrorCode == 429 || apiEx2.ErrorCode >= 500)))
        {
            int retryCount = _networkErrorRetryCount++;
            int delaySeconds = Math.Min(30, (int)Math.Pow(2, Math.Min(retryCount, 5)));
            
            Logging.AddToLog($"Connection issue detected. Waiting {delaySeconds} seconds before attempting to reconnect... (Attempt {retryCount})");
            
            await Task.Delay(delaySeconds * 1000, cancellationToken);
            
            try
            {
                await ClearWebhook(botClient);
                Logging.AddToLog("Webhook cleared successfully.");
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error clearing webhook: {ex.Message}");
            }
            
            Logging.AddToLog("Attempting to restart receiving updates...");
        }
        else
        {
            Logging.AddToLog($"Unhandled error: {errorMessage}");
        }
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
            // Ensure we're using the correct link format from config
            string link = Config.LinkToBot + "?start=" + RefLinks[userId];
            
            // Log the link for debugging
            Logging.AddToLog($"Retrieved existing referral link: {link}");
            Console.WriteLine($"Retrieved existing referral link: {link}");
            
            return link;
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
            
            // Ensure we're using the correct link format from config
            string link = Config.LinkToBot + "?start=" + base64String;
            
            // Log the link for debugging
            Logging.AddToLog($"Generated referral link: {link}");
            Console.WriteLine($"Generated referral link: {link}");
            
            return link;
        }
    }
    
    /// <summary>
    /// Updates Point totals for all users
    /// </summary>
    public static async void UpdatePointTotals()
    {
        foreach (string userId in UserActivity.Keys)
        {
            int points = 0;
            
            // Add points from referrals
            if (PointsByReferrer.ContainsKey(userId))
            {
                points += PointsByReferrer[userId];
            }
            
            // Apply any point offset
            if (UserPointOffset.ContainsKey(userId))
            {
                points += UserPointOffset[userId];
            }
            
            // Update in-memory cache
            PointTotals[userId] = points;
            
            // Update MongoDB if available
            if (MongoDb != null)
            {
                try
                {
                    // Use the dedicated method for updating bricks
                    await MongoDb.UpdateUserBricksAsync(userId, points);
                }
                catch (Exception ex)
                {
                    Logging.AddToLog($"Error updating user points in MongoDB: {ex.Message}");
                }
            }
        }
        
        // Save to file
        SaveMethods.SavePointsByReferrer();
    }
    
    /// <summary>
    /// Checks if a password is valid for admin access
    /// </summary>
    public static string? CheckPassword(string text, string userId)
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
                return string.Empty;
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
    
    private static System.Timers.Timer? _mongoDbSaveTimer;
    
    private static void StartApiSyncTimer()
    {
        _apiSyncTimer = new System.Timers.Timer(15 * 60 * 1000); // 15 minutes
        _apiSyncTimer.Elapsed += async (sender, e) => await ApiIntegration.SyncReferralsAsync();
        _apiSyncTimer.AutoReset = true;
        _apiSyncTimer.Start();
        
        Console.WriteLine("API sync timer started. Will sync with backend every 15 minutes.");
    }
    
    /// <summary>
    /// Starts a timer to periodically save data to MongoDB
    /// </summary>
    private static void StartMongoDbSaveTimer()
    {
        if (MongoDb == null)
        {
            Console.WriteLine("MongoDB not initialized. Not starting MongoDB save timer.");
            return;
        }
        
        _mongoDbSaveTimer = new System.Timers.Timer(5 * 60 * 1000); // 5 minutes
        _mongoDbSaveTimer.Elapsed += async (sender, e) => await SaveDataToMongoDbAsync();
        _mongoDbSaveTimer.AutoReset = true;
        _mongoDbSaveTimer.Start();
        
        Console.WriteLine("MongoDB save timer started. Will save data to MongoDB every 5 minutes.");
    }
    
    /// <summary>
    /// Saves all in-memory data to MongoDB
    /// </summary>
    private static async Task SaveDataToMongoDbAsync()
    {
        if (MongoDb == null)
        {
            Logging.AddToLog("MongoDB not available for saving data");
            return;
        }
        
        try
        {
            Logging.AddToLog("Saving data to MongoDB...");
            
            // Save users and their points
            foreach (var entry in PointTotals)
            {
                var userId = entry.Key;
                var points = entry.Value;
                
                // Get or create user
                var user = await MongoDb.GetUserAsync(userId);
                if (user == null)
                {
                    // Create new user with proper nested bricks structure
                    user = new Models.UserModel
                    {
                        TelegramId = userId,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    
                    // Set bricks using the property that handles the nested structure
                    user.BricksTotal = points;
                    
                    await MongoDb.CreateUserAsync(user);
                    Logging.AddToLog($"Created user in MongoDB: {userId}");
                }
                else
                {
                    // Update bricks directly using the UpdateUserBricksAsync method
                    await MongoDb.UpdateUserBricksAsync(userId, points);
                    Logging.AddToLog($"Updated user bricks in MongoDB: {userId}");
                }
            }
            
            // Save referrals
            if (MongoDb != null)
            {
                foreach (var entry in ReferredBy)
                {
                    var referredId = entry.Key;
                    var referrerId = entry.Value;
                    
                    // Check if referral already exists
                    var existingReferral = await MongoDb.GetReferralByReferredIdAsync(referredId);
                    if (existingReferral == null)
                    {
                        // Create the referral document
                        var referral = new Models.ReferralModel
                        {
                            ReferrerId = referrerId,
                            ReferredId = referredId,
                            Points = Config.ReferralReward,
                            Timestamp = DateTime.UtcNow,
                            Type = "referral"
                        };
                        
                        await MongoDb.CreateReferralAsync(referral);
                        
                        // Also add to the user's referrals array
                        // Get the referred user to get their name
                        var referredUser = await MongoDb.GetUserAsync(referredId);
                        string referredName = "Telegram User";
                        if (referredUser != null && !string.IsNullOrEmpty(referredUser.FirstName))
                        {
                            referredName = referredUser.FirstName;
                            if (!string.IsNullOrEmpty(referredUser.LastName))
                                referredName += " " + referredUser.LastName;
                        }
                        
                        // Add to referrer's referrals array
                        await MongoDb.AddReferralToUserAsync(
                            referrerId,
                            referredId,
                            referredName,
                            Config.ReferralReward);
                        
                        Logging.AddToLog($"Created referral in MongoDB: {referredId} referred by {referrerId}");
                    }
                }
            }
            
            // Save referral links
            if (MongoDb != null)
            {
                var refLinks = await MongoDb.GetAllRefLinksAsync();
                if (refLinks != null && refLinks.Count > 0)
                {
                    RefLinks = refLinks;
                    Console.WriteLine($"Loaded {refLinks.Count} referral links from MongoDB");
                    Logging.AddToLog($"Loaded {refLinks.Count} referral links from MongoDB");
                }
            }
            
            // Save users and their data
            if (MongoDb != null)
            {
                var users = await MongoDb.GetAllUsersAsync();
                if (users != null && users.Count > 0)
                {
                    Console.WriteLine($"Loaded {users.Count} users from MongoDB");
                    Logging.AddToLog($"Loaded {users.Count} users from MongoDB");
                    
                    // Process user data
                    foreach (var user in users)
                    {
                        // Load password attempts
                        if (!string.IsNullOrEmpty(user.TelegramId))
                        {
                            PasswordAttempts[user.TelegramId] = user.IsAdmin ? -1 : user.PasswordAttempts;
                        }
                        
                        // Load show welcome flag
                        if (!string.IsNullOrEmpty(user.TelegramId))
                        {
                            ShowWelcome[user.TelegramId] = user.ShowWelcome;
                        }
                    }
                }
            }
            
            // Save referrals
            if (MongoDb != null)
            {
                var referrals = await MongoDb.GetAllReferralsAsync();
                if (referrals != null && referrals.Count > 0)
                {
                    Console.WriteLine($"Loaded {referrals.Count} referrals from MongoDB");
                    Logging.AddToLog($"Loaded {referrals.Count} referrals from MongoDB");
                    
                    // Process referral data
                    foreach (var referral in referrals)
                    {
                        if (referral.ReferredId != null && referral.ReferrerId != null)
                        {
                            // Load referred by relationships
                            if (!string.IsNullOrEmpty(referral.ReferredId) && !string.IsNullOrEmpty(referral.ReferrerId))
                            {
                                ReferredBy[referral.ReferredId] = referral.ReferrerId;
                                
                                // Load referral points
                                if (ReferralPoints.ContainsKey(referral.ReferrerId))
                                {
                                    ReferralPoints[referral.ReferrerId] += referral.Points;
                                }
                                else
                                {
                                    ReferralPoints[referral.ReferrerId] = referral.Points;
                                }
                            }
                        }
                    }
                }
            }
            
            // Load user activities
            if (MongoDb != null)
            {
                var userList = await MongoDb.GetAllUsersAsync();
                if (userList != null && userList.Count > 0)
                {
                    foreach (var user in userList)
                    {
                        if (user.TelegramId != null)
                        {
                            var activities = await MongoDb.GetAllUserActivitiesAsync(user.TelegramId);
                            if (activities != null && activities.Count > 0 && !string.IsNullOrEmpty(user.TelegramId))
                            {
                                UserActivity[user.TelegramId] = activities;
                            }
                        }
                    }
                }
            }
            
            // Update point totals
            UpdatePointTotals();
            
            Logging.AddToLog("Data saved to MongoDB successfully");
        }
        catch (Exception ex)
        {
            Logging.AddToLog($"Error saving data to MongoDB: {ex.Message}");
            Console.WriteLine($"Error saving data to MongoDB: {ex.Message}");
        }
    }
    
    /// <summary>
    /// Loads data from MongoDB into memory
    /// </summary>
    private static async Task LoadDataFromMongoDbAsync()
    {
        try
        {
            Console.WriteLine("Loading data from MongoDB...");
            Logging.AddToLog("Loading data from MongoDB...");
            
            // Load referral links
            if (MongoDb != null)
            {
                var refLinks = await MongoDb.GetAllRefLinksAsync();
                if (refLinks != null && refLinks.Count > 0)
                {
                    RefLinks = refLinks;
                    Console.WriteLine($"Loaded {refLinks.Count} referral links from MongoDB");
                    Logging.AddToLog($"Loaded {refLinks.Count} referral links from MongoDB");
                }
            }
            
            // Load users and their data
            if (MongoDb != null)
            {
                var users = await MongoDb.GetAllUsersAsync();
                if (users != null && users.Count > 0)
                {
                    Console.WriteLine($"Loaded {users.Count} users from MongoDB");
                    Logging.AddToLog($"Loaded {users.Count} users from MongoDB");
                    
                    // Process user data
                    foreach (var user in users)
                    {
                        // Load password attempts
                        if (!string.IsNullOrEmpty(user.TelegramId))
                        {
                            PasswordAttempts[user.TelegramId] = user.IsAdmin ? -1 : user.PasswordAttempts;
                        }
                        
                        // Load show welcome flag
                        if (!string.IsNullOrEmpty(user.TelegramId))
                        {
                            ShowWelcome[user.TelegramId] = user.ShowWelcome;
                        }
                    }
                }
            }
            
            // Load referrals
            if (MongoDb != null)
            {
                var referrals = await MongoDb.GetAllReferralsAsync();
                if (referrals != null && referrals.Count > 0)
                {
                    Console.WriteLine($"Loaded {referrals.Count} referrals from MongoDB");
                    Logging.AddToLog($"Loaded {referrals.Count} referrals from MongoDB");
                    
                    // Process referral data
                    foreach (var referral in referrals)
                    {
                        if (referral.ReferredId != null && referral.ReferrerId != null)
                        {
                            // Load referred by relationships
                            if (!string.IsNullOrEmpty(referral.ReferredId) && !string.IsNullOrEmpty(referral.ReferrerId))
                            {
                                ReferredBy[referral.ReferredId] = referral.ReferrerId;
                                
                                // Load referral points
                                if (ReferralPoints.ContainsKey(referral.ReferrerId))
                                {
                                    ReferralPoints[referral.ReferrerId] += referral.Points;
                                }
                                else
                                {
                                    ReferralPoints[referral.ReferrerId] = referral.Points;
                                }
                            }
                        }
                    }
                }
            }
            
            // Load user activities
            if (MongoDb != null)
            {
                var userList = await MongoDb.GetAllUsersAsync();
                if (userList != null && userList.Count > 0)
                {
                    foreach (var user in userList)
                    {
                        if (user.TelegramId != null)
                        {
                            var activities = await MongoDb.GetAllUserActivitiesAsync(user.TelegramId);
                            if (activities != null && activities.Count > 0 && !string.IsNullOrEmpty(user.TelegramId))
                            {
                                UserActivity[user.TelegramId] = activities;
                            }
                        }
                    }
                }
            }
            
            // Update point totals
            UpdatePointTotals();
            
            Console.WriteLine("Data loaded from MongoDB successfully");
            Logging.AddToLog("Data loaded from MongoDB successfully");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading data from MongoDB: {ex.Message}");
            Logging.AddToLog($"Error loading data from MongoDB: {ex.Message}");
            
            // Fallback to file storage
            Console.WriteLine("Falling back to file storage");
            Logging.AddToLog("Falling back to file storage");
            
            // Load data from files instead
            LoadAllData();
        }
    }
    
    /// <summary>
    /// Load all data from files
    /// </summary>
    private static void LoadAllData()
    {
        try
        {
            // Load configuration
            LoadData.LoadConf();
            Console.WriteLine("Configuration loaded successfully.");
            
            // Initialize collections if they're null
            if (UserActivity == null) UserActivity = new Dictionary<string, Dictionary<string, int>>();
            if (RefLinks == null) RefLinks = new Dictionary<string, string>();
            if (ReferredBy == null) ReferredBy = new Dictionary<string, string>();
            if (PasswordAttempts == null) PasswordAttempts = new Dictionary<string, int>();
            if (ShowWelcome == null) ShowWelcome = new Dictionary<string, bool>();
            if (ReferralPoints == null) ReferralPoints = new Dictionary<string, int>();
            if (PointsByReferrer == null) PointsByReferrer = new Dictionary<string, int>();
            if (UserPointOffset == null) UserPointOffset = new Dictionary<string, int>();
            if (JoinedReferrals == null) JoinedReferrals = new Dictionary<string, bool>();
            
            // Log that we're using MongoDB instead of file storage
            Console.WriteLine("Using MongoDB for data persistence. File loading skipped.");
            Logging.AddToLog("Using MongoDB for data persistence. File loading skipped.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading configuration: {ex.Message}");
            Logging.AddToLog($"Error loading configuration: {ex.Message}");
        }
    }
}
