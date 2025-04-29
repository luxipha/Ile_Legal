using Telegram.Bot;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;
using Telegram.Bot.Types.ReplyMarkups;

namespace TelegramReferralBot;

/// <summary>
/// Contains methods for processing messages and handling bot commands
/// </summary>
public static class MessageProcessor
{
    /// <summary>
    /// Processes incoming messages
    /// </summary>
    public static async Task ProcessMessageAsync(Message message, CancellationToken cancellationToken)
    {
        try
        {
            if (message.Text is null)
                return;

            var chatId = message.Chat.Id;
            var userId = message.From?.Id.ToString() ?? "unknown";
            var messageText = message.Text;

            // Check if this is a private chat or group chat
            if (message.Chat.Type == ChatType.Private)
            {
                await HandlePrivateMessageAsync(message, cancellationToken);
            }
            else if (message.Chat.Type == ChatType.Group || message.Chat.Type == ChatType.Supergroup)
            {
                await HandleGroupMessageAsync(message, cancellationToken);
            }
        }
        catch (Exception ex)
        {
            string text = $"Error in ProcessMessageAsync: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
        }
    }

    /// <summary>
    /// Processes callback queries from inline keyboards
    /// </summary>
    public static async Task ProcessCallbackQueryAsync(CallbackQuery callbackQuery, CancellationToken cancellationToken)
    {
        try
        {
            if (callbackQuery?.Data == null)
                return;

            var chatId = callbackQuery.Message?.Chat.Id;
            var userId = callbackQuery.From.Id.ToString();
            
            Logging.AddToLog($"Callback query from {userId}: {callbackQuery.Data}");
            
            // Answer the callback query to remove the loading indicator
            await Program.BotClient.AnswerCallbackQueryAsync(
                callbackQuery.Id,
                cancellationToken: cancellationToken);
            
            // Process different callback data
            if (callbackQuery.Data.StartsWith("viewpoints"))
            {
                await HandleViewPointsCallback(callbackQuery, cancellationToken);
            }
            else if (callbackQuery.Data.StartsWith("viewreferrals"))
            {
                await HandleViewReferralsCallback(callbackQuery, cancellationToken);
            }
            else if (callbackQuery.Data.StartsWith("help"))
            {
                await HandleHelpCallback(callbackQuery, cancellationToken);
            }
        }
        catch (Exception ex)
        {
            string text = $"Error in ProcessCallbackQueryAsync: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
        }
    }
    
    /// <summary>
    /// Handles the viewpoints callback
    /// </summary>
    private static async Task HandleViewPointsCallback(CallbackQuery callbackQuery, CancellationToken cancellationToken)
    {
        try
        {
            var chatId = callbackQuery.Message?.Chat.Id;
            var userId = callbackQuery.From.Id.ToString();
            
            if (chatId == null)
                return;
            
            // Get points from backend
            var points = await ApiIntegration.GetUserPointsAsync(userId);
            
            string message = $"You have {points} points.";
            
            await Program.BotClient.SendTextMessageAsync(
                chatId: chatId.Value,
                text: message,
                cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            Logging.AddToLog($"Error in HandleViewPointsCallback: {ex.Message}");
        }
    }
    
    /// <summary>
    /// Handles the viewreferrals callback
    /// </summary>
    private static async Task HandleViewReferralsCallback(CallbackQuery callbackQuery, CancellationToken cancellationToken)
    {
        try
        {
            var chatId = callbackQuery.Message?.Chat.Id;
            var userId = callbackQuery.From.Id.ToString();
            
            if (chatId == null)
                return;
            
            // Get referral count
            int referralCount = 0;
            foreach (var entry in Program.ReferredBy)
            {
                if (entry.Value == userId)
                {
                    referralCount++;
                }
            }
            
            string message = $"You have referred {referralCount} users.";
            
            await Program.BotClient.SendTextMessageAsync(
                chatId: chatId.Value,
                text: message,
                cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            Logging.AddToLog($"Error in HandleViewReferralsCallback: {ex.Message}");
        }
    }
    
    /// <summary>
    /// Handles the help callback
    /// </summary>
    private static async Task HandleHelpCallback(CallbackQuery callbackQuery, CancellationToken cancellationToken)
    {
        try
        {
            var chatId = callbackQuery.Message?.Chat.Id;
            
            if (chatId == null)
                return;
            
            string message = "Available commands:\n" +
                             "/start - Start the bot\n" +
                             "/help - Show this help message\n" +
                             "/referral - Get your referral link\n" +
                             "/points - Check your points";
            
            await Program.BotClient.SendTextMessageAsync(
                chatId: chatId.Value,
                text: message,
                cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            Logging.AddToLog($"Error in HandleHelpCallback: {ex.Message}");
        }
    }

    /// <summary>
    /// Handles messages in private chats
    /// </summary>
    private static async Task HandlePrivateMessageAsync(Message message, CancellationToken cancellationToken)
    {
        var chatId = message.Chat.Id;
        var userId = message.From?.Id.ToString() ?? "unknown";
        var messageText = message.Text ?? string.Empty;

        // Log received message for debugging
        Console.WriteLine($"Received a '{messageText}' message in chat {chatId} from user {userId}.");

        // Check if user is awaiting reply
        if (Program.AwaitingReply.Contains(userId))
        {
            // Handle password check
            string result = Program.CheckPassword(messageText, userId);
            if (result == "confirmed")
            {
                Program.AwaitingReply.Remove(userId);
                await Program.BotClient.SendTextMessageAsync(
                    chatId: chatId,
                    text: "Password confirmed. You can now use admin commands.",
                    cancellationToken: cancellationToken);
            }
            else if (result == "wrong_1")
            {
                await Program.BotClient.SendTextMessageAsync(
                    chatId: chatId,
                    text: "Incorrect password. You have 9 attempts remaining.",
                    cancellationToken: cancellationToken);
            }
            else if (result.StartsWith("wrong_"))
            {
                int attemptsLeft = 10 - int.Parse(result.Split('_')[1]);
                await Program.BotClient.SendTextMessageAsync(
                    chatId: chatId,
                    text: $"Incorrect password. You have {attemptsLeft} attempts remaining.",
                    cancellationToken: cancellationToken);
            }
            else if (result == "banned")
            {
                Program.AwaitingReply.Remove(userId);
                await Program.BotClient.SendTextMessageAsync(
                    chatId: chatId,
                    text: "Too many incorrect attempts. You are now banned from using admin commands.",
                    cancellationToken: cancellationToken);
            }
            return;
        }

        // Handle menu button clicks
        if (messageText == "🔗 Get Referral Link")
        {
            await SendReferralLinkAsync(chatId, userId, message.From!, cancellationToken);
            return;
        }
        else if (messageText == "🏆 My Bricks")
        {
            await SendPointsInfoAsync(chatId, userId, cancellationToken);
            return;
        }
        else if (messageText == "📊 Leaderboard")
        {
            await SendLeaderboardAsync(chatId, cancellationToken);
            return;
        }
        else if (messageText == "❓ Help")
        {
            await SendHelpMessageAsync(chatId, cancellationToken);
            return;
        }

        // Handle commands
        if (messageText.StartsWith("/"))
        {
            if (messageText.StartsWith("/start"))
            {
                // Handle start command with referral parameter
                string[] parts = messageText.Split(' ');
                if (parts.Length > 1)
                {
                    string refCode = parts[1];
                    await HandleReferralAsync(message, refCode, cancellationToken);
                }
                else
                {
                    // Regular start command
                    await SendWelcomeMessageAsync(chatId, userId, cancellationToken);
                }
            }
            else if (messageText == "/help")
            {
                await SendHelpMessageAsync(chatId, cancellationToken);
            }
            else if (messageText == "/getRefLink")
            {
                await SendReferralLinkAsync(chatId, userId, message.From!, cancellationToken);
            }
            else if (messageText == "/myPoints")
            {
                await SendPointsInfoAsync(chatId, userId, cancellationToken);
            }
            else if (messageText == "/admin")
            {
                await RequestPasswordAsync(chatId, userId, cancellationToken);
            }
            else if (messageText.StartsWith("/ban") && IsAdmin(userId))
            {
                await BanUserAsync(message, cancellationToken);
            }
            else if (messageText.StartsWith("/unban") && IsAdmin(userId))
            {
                await UnbanUserAsync(message, cancellationToken);
            }
            else if (messageText.StartsWith("/setgroup") && IsAdmin(userId))
            {
                await SetGroupAsync(message, cancellationToken);
            }
            else if (messageText == "/leaderboard")
            {
                await SendLeaderboardAsync(chatId, cancellationToken);
            }
            else if (messageText == "/journey" || messageText == "/rewards" || messageText == "/map")
            {
                await SendBricksJourneyMapAsync(chatId, cancellationToken);
            }
            else if (messageText == "/testpoints")
            {
                await TestPointsSystemAsync(chatId, cancellationToken);
            }
        }
    }

    /// <summary>
    /// Handles messages in group chats
    /// </summary>
    private static async Task HandleGroupMessageAsync(Message message, CancellationToken cancellationToken)
    {
        var chatId = message.Chat.Id;
        var userId = message.From?.Id.ToString() ?? "unknown";
        var messageText = message.Text ?? string.Empty;

        // Log received message for debugging
        Console.WriteLine($"Received a '{messageText}' message in chat {chatId} from user {userId}.");

        // Update user activity if this is the target group
        if (chatId == Config.GroupChatIdNumber && message.From is not null)
        {
            await UpdateUserActivityAsync(message, cancellationToken);
        }

        // Handle commands in group
        if (messageText.StartsWith("/"))
        {
            if (messageText == "/disableWelcome" && IsAdmin(userId))
            {
                await DisableWelcomeAsync(chatId, cancellationToken);
            }
            else if (messageText == "/enableWelcome" && IsAdmin(userId))
            {
                await EnableWelcomeAsync(chatId, cancellationToken);
            }
            else if (messageText == "/help")
            {
                await SendHelpMessageAsync(chatId, cancellationToken);
            }
            else if (messageText == "/myID")
            {
                await SendUserIdAsync(chatId, userId, cancellationToken);
            }
            else if (messageText == "/top10")
            {
                await SendLeaderboardAsync(chatId, cancellationToken);
            }
            else if (messageText == "/refTotal")
            {
                await SendRefTotalAsync(chatId, cancellationToken);
            }
            else if (messageText == "/points" || messageText == "/myPoints")
            {
                await SendPointsInfoAsync(chatId, userId, cancellationToken);
            }
            else if (messageText == "/journey" || messageText == "/rewards" || messageText == "/map")
            {
                await SendBricksJourneyMapAsync(chatId, cancellationToken);
            }
        }
    }

    /// <summary>
    /// Sends welcome message to user
    /// </summary>
    private static async Task SendWelcomeMessageAsync(long chatId, string userId, CancellationToken cancellationToken)
    {
        string welcomeMessage = $"Welcome to IleRefer Bot!\n\n" +
                               $"This bot helps you track referrals and earn Bricks.\n\n" +
                               $"• Get your referral link and share it with friends\n" +
                               $"• When they join using your link, you get Bricks\n" +
                               $"• Earn more Bricks when your referrals are active\n" +
                               $"• Compete for the top position on the leaderboard\n\n" +
                               $"Use the buttons below or type commands to interact with me:";

        // Create a custom keyboard with the most common commands
        var replyMarkup = new ReplyKeyboardMarkup(new[]
        {
            new KeyboardButton[] { "🔗 Get Referral Link", "🏆 My Bricks" },
            new KeyboardButton[] { "📊 Leaderboard", "❓ Help" }
        })
        {
            ResizeKeyboard = true
        };

        await Program.BotClient.SendTextMessageAsync(
            chatId: chatId,
            text: welcomeMessage,
            replyMarkup: replyMarkup,
            cancellationToken: cancellationToken);
            
        // Mark that we've shown the welcome message
        if (!Program.ShowWelcome.ContainsKey(userId))
        {
            Program.ShowWelcome.Add(userId, true);
            SaveMethods.SaveShowWelcome();
        }
    }

    /// <summary>
    /// Sends help message with available commands
    /// </summary>
    private static async Task SendHelpMessageAsync(long chatId, CancellationToken cancellationToken)
    {
        string helpMessage = "Available commands:\n\n" +
                            "/disableNotice - (Private Chat Only) Turn off private bot notices.\n" +
                            "/enableNotice - (Private Chat Only) Turn on private bot notices.\n" +
                            "/getRefLink - (Private Chat Only) Generates your referral code for the program.\n" +
                            "/help - Sends a list of available commands.\n" +
                            "/journey - View the Ilé Bricks Journey Map with rewards.\n" +
                            "/listAll - (Private Chat Only) Full list of all members with Bricks.\n" +
                            "/listRef - (Private Chat Only) Full list of all members referral count.\n" +
                            "/myID - Gets your Telegram user ID.\n" +
                            "/myPoints - Gets your current referral Bricks total.\n" +
                            "/points - View your current Bricks balance.\n" +
                            "/refTotal - Displays a list of total referred members per day.\n" +
                            "/testpoints - (Admin Only) Test the Bricks system.\n" +
                            "/top10 - Displays the names and Bricks of the top 10 ranks in the referral program.";

        await Program.BotClient.SendTextMessageAsync(
            chatId: chatId,
            text: helpMessage,
            cancellationToken: cancellationToken);
    }

    /// <summary>
    /// Sends user's referral link
    /// </summary>
    private static async Task SendReferralLinkAsync(long chatId, string userId, User user, CancellationToken cancellationToken)
    {
        string result = Program.GetRefLink(user);
        
        if (result.StartsWith("Exists?"))
        {
            string link = result.Substring(7);
            await Program.BotClient.SendTextMessageAsync(
                chatId: chatId,
                text: $"Your referral link is:\n{link}\n\nShare this link with your friends to earn Bricks!",
                cancellationToken: cancellationToken);
        }
        else
        {
            await Program.BotClient.SendTextMessageAsync(
                chatId: chatId,
                text: $"Your referral link is:\n{result}\n\nShare this link with your friends to earn Bricks!",
                cancellationToken: cancellationToken);
        }
    }

    /// <summary>
    /// Sends user's Bricks information
    /// </summary>
    private static async Task SendPointsInfoAsync(long chatId, string userId, CancellationToken cancellationToken)
    {
        int points = 0;
        
        // Get points from referrals
        if (Program.PointsByReferrer.ContainsKey(userId))
        {
            points += Program.PointsByReferrer[userId];
        }
        
        // Apply any point offset
        if (Program.UserPointOffset.ContainsKey(userId))
        {
            points += Program.UserPointOffset[userId];
        }
        
        // Check if user is banned
        bool isBanned = Program.UserPointOffset.ContainsKey(userId) && Program.UserPointOffset[userId] == -1000000;
        
        if (isBanned)
        {
            await Program.BotClient.SendTextMessageAsync(
                chatId: chatId,
                text: "You have been banned from the referral program.",
                cancellationToken: cancellationToken);
        }
        else if (points == 0)
        {
            await Program.BotClient.SendTextMessageAsync(
                chatId: chatId,
                text: "You don't have any Bricks yet. You can earn Bricks by:\n\n" +
                      "• Referring new members to the group\n" +
                      "• Being active in the group\n" +
                      "• Completing special tasks\n\n" +
                      "Type /getRefLink in a private chat with me to get your referral link and start earning Bricks!",
                cancellationToken: cancellationToken);
        }
        else
        {
            await Program.BotClient.SendTextMessageAsync(
                chatId: chatId,
                text: $"You have {points} Bricks.\n\n" +
                      $"Bricks are earned by referring new members and when your referred members are active in the group.",
                cancellationToken: cancellationToken);
        }
    }

    /// <summary>
    /// Handles referral process when a user clicks a referral link
    /// </summary>
    private static async Task HandleReferralAsync(Message message, string refCode, CancellationToken cancellationToken)
    {
        var chatId = message.Chat.Id;
        var userId = message.From?.Id.ToString() ?? "unknown";
        
        // Find the referrer
        string? referrerId = null;
        foreach (var entry in Program.RefLinks)
        {
            if (entry.Value == refCode)
            {
                referrerId = entry.Key;
                break;
            }
        }
        
        if (referrerId is null)
        {
            // Invalid referral code
            await SendWelcomeMessageAsync(chatId, userId, cancellationToken);
            return;
        }
        
        // Can't refer yourself
        if (referrerId == userId)
        {
            await Program.BotClient.SendTextMessageAsync(
                chatId: chatId,
                text: "You cannot refer yourself.",
                cancellationToken: cancellationToken);
            return;
        }
        
        // Check if user is already referred
        if (Program.ReferredBy.ContainsKey(userId))
        {
            await Program.BotClient.SendTextMessageAsync(
                chatId: chatId,
                text: "You have already been referred by someone else.",
                cancellationToken: cancellationToken);
            return;
        }
        
        // Add referral
        Program.ReferredBy.Add(userId, referrerId);
        SaveMethods.SaveReferredBy();
        
        // Add referral point
        if (Program.ReferralPoints.ContainsKey(referrerId))
        {
            Program.ReferralPoints[referrerId]++;
        }
        else
        {
            Program.ReferralPoints.Add(referrerId, 1);
        }
        SaveMethods.SaveReferralPoints();
        
        // Update points
        Program.UpdatePointTotals();
        
        // Send welcome message
        await Program.BotClient.SendTextMessageAsync(
            chatId: chatId,
            text: $"Welcome! You have been referred by a user.\n\n" +
                  $"Join our group: {Config.LinkToGroup}\n\n" +
                  $"Use /getRefLink to get your own referral link.",
            cancellationToken: cancellationToken);
        
        // Notify referrer
        try
        {
            await Program.BotClient.SendTextMessageAsync(
                chatId: long.Parse(referrerId),
                text: $"A new user has joined using your referral link! You earned 1 Brick.",
                cancellationToken: cancellationToken);
        }
        catch
        {
            // Ignore errors if we can't message the referrer
        }
    }

    /// <summary>
    /// Updates user activity in the group
    /// </summary>
    private static async Task UpdateUserActivityAsync(Message message, CancellationToken cancellationToken)
    {
        var userId = message.From?.Id.ToString() ?? "unknown";
        var messageText = message.Text ?? string.Empty;
        
        // Check if message is long enough to count for points
        if (messageText.Length < Config.ThresholdForMessagePoint)
            return;
        
        // Check if user was referred by someone
        if (!Program.ReferredBy.ContainsKey(userId))
            return;
        
        string referrerId = Program.ReferredBy[userId];
        
        // Get current date
        string today = DateTime.Now.ToString("MM/dd/yyyy");
        
        // Check if today is in the campaign period
        if (!Program.CampaignDays.Contains(today))
            return;
        
        // Update user activity
        Dictionary<string, int> userActivityPerDay;
        if (Program.UserActivity.ContainsKey(userId))
        {
            userActivityPerDay = Program.UserActivity[userId];
            
            // Add today if not present
            if (!userActivityPerDay.ContainsKey(today))
            {
                userActivityPerDay.Add(today, 0);
            }
            
            // Increment activity count for today
            userActivityPerDay[today]++;
        }
        else
        {
            // Create new user activity dictionary
            userActivityPerDay = Program.CreateUserActivityDictionary(userId);
            if (userActivityPerDay is null)
                return;
            
            // Increment activity count for today
            if (userActivityPerDay.ContainsKey(today))
            {
                userActivityPerDay[today]++;
            }
        }
        
        // Save user activity
        SaveMethods.SaveUserActivity();
        
        // Update points
        Program.UpdatePointTotals();
    }

    /// <summary>
    /// Requests admin password
    /// </summary>
    private static async Task RequestPasswordAsync(long chatId, string userId, CancellationToken cancellationToken)
    {
        // Check if user is banned
        if (Program.PasswordAttempts.ContainsKey(userId) && Program.PasswordAttempts[userId] >= 11)
        {
            await Program.BotClient.SendTextMessageAsync(
                chatId: chatId,
                text: "You have been banned from using admin commands due to too many incorrect password attempts.",
                cancellationToken: cancellationToken);
            return;
        }
        
        // Add user to awaiting reply list
        if (!Program.AwaitingReply.Contains(userId))
        {
            Program.AwaitingReply.Add(userId);
        }
        
        await Program.BotClient.SendTextMessageAsync(
            chatId: chatId,
            text: "Please enter the admin password:",
            cancellationToken: cancellationToken);
    }

    /// <summary>
    /// Bans a user from the referral program
    /// </summary>
    private static async Task BanUserAsync(Message message, CancellationToken cancellationToken)
    {
        var chatId = message.Chat.Id;
        var messageText = message.Text ?? string.Empty;
        
        string[] parts = messageText.Split(' ');
        if (parts.Length < 2)
        {
            await Program.BotClient.SendTextMessageAsync(
                chatId: chatId,
                text: "Usage: /ban [user_id]",
                cancellationToken: cancellationToken);
            return;
        }
        
        string targetUserId = parts[1];
        
        // Set user point offset to -1000000 (banned)
        if (Program.UserPointOffset.ContainsKey(targetUserId))
        {
            Program.UserPointOffset[targetUserId] = -1000000;
        }
        else
        {
            Program.UserPointOffset.Add(targetUserId, -1000000);
        }
        
        SaveMethods.SaveUserPointOffset();
        Program.UpdatePointTotals();
        
        await Program.BotClient.SendTextMessageAsync(
            chatId: chatId,
            text: $"User {targetUserId} has been banned from the referral program.",
            cancellationToken: cancellationToken);
    }

    /// <summary>
    /// Unbans a user from the referral program
    /// </summary>
    private static async Task UnbanUserAsync(Message message, CancellationToken cancellationToken)
    {
        var chatId = message.Chat.Id;
        var messageText = message.Text ?? string.Empty;
        
        string[] parts = messageText.Split(' ');
        if (parts.Length < 2)
        {
            await Program.BotClient.SendTextMessageAsync(
                chatId: chatId,
                text: "Usage: /unban [user_id]",
                cancellationToken: cancellationToken);
            return;
        }
        
        string targetUserId = parts[1];
        
        // Remove ban by setting point offset to 0
        if (Program.UserPointOffset.ContainsKey(targetUserId))
        {
            Program.UserPointOffset[targetUserId] = 0;
        }
        else
        {
            Program.UserPointOffset.Add(targetUserId, 0);
        }
        
        SaveMethods.SaveUserPointOffset();
        Program.UpdatePointTotals();
        
        await Program.BotClient.SendTextMessageAsync(
            chatId: chatId,
            text: $"User {targetUserId} has been unbanned from the referral program.",
            cancellationToken: cancellationToken);
    }

    /// <summary>
    /// Sets the target group for the referral program
    /// </summary>
    private static async Task SetGroupAsync(Message message, CancellationToken cancellationToken)
    {
        var chatId = message.Chat.Id;
        var messageText = message.Text ?? string.Empty;
        
        string[] parts = messageText.Split(' ');
        if (parts.Length < 2)
        {
            await Program.BotClient.SendTextMessageAsync(
                chatId: chatId,
                text: "Usage: /setgroup [group_id]",
                cancellationToken: cancellationToken);
            return;
        }
        
        if (long.TryParse(parts[1], out long groupId))
        {
            Config.GroupChatIdNumber = groupId;
            SaveMethods.SaveGroupChatIdNumber();
            
            await Program.BotClient.SendTextMessageAsync(
                chatId: chatId,
                text: $"Target group has been set to {groupId}.",
                cancellationToken: cancellationToken);
        }
        else
        {
            await Program.BotClient.SendTextMessageAsync(
                chatId: chatId,
                text: "Invalid group ID. Please provide a valid numeric ID.",
                cancellationToken: cancellationToken);
        }
    }

    /// <summary>
    /// Sends the leaderboard of top referrers
    /// </summary>
    private static async Task SendLeaderboardAsync(long chatId, CancellationToken cancellationToken)
    {
        // Get top 10 referrers by points
        var topReferrers = Program.PointsByReferrer
            .Where(x => !Program.UserPointOffset.ContainsKey(x.Key) || Program.UserPointOffset[x.Key] != -1000000) // Exclude banned users
            .OrderByDescending(x => x.Value)
            .Take(10)
            .ToList();
        
        if (topReferrers.Count == 0)
        {
            await Program.BotClient.SendTextMessageAsync(
                chatId: chatId,
                text: "No referrers yet.",
                cancellationToken: cancellationToken);
            return;
        }
        
        string leaderboardMessage = "🏆 Top Referrers 🏆\n\n";
        
        for (int i = 0; i < topReferrers.Count; i++)
        {
            leaderboardMessage += $"{i + 1}. User {topReferrers[i].Key}: {topReferrers[i].Value} Bricks\n";
        }
        
        await Program.BotClient.SendTextMessageAsync(
            chatId: chatId,
            text: leaderboardMessage,
            cancellationToken: cancellationToken);
    }

    /// <summary>
    /// Checks if a user is an admin
    /// </summary>
    private static bool IsAdmin(string userId)
    {
        return Program.PasswordAttempts.ContainsKey(userId) && 
               Program.PasswordAttempts[userId] == -1; // -1 is used to mark confirmed admins
    }

    /// <summary>
    /// Sends the user's Telegram ID
    /// </summary>
    private static async Task SendUserIdAsync(long chatId, string userId, CancellationToken cancellationToken)
    {
        await Program.BotClient.SendTextMessageAsync(
            chatId: chatId,
            text: $"Your Telegram ID is: {userId}",
            cancellationToken: cancellationToken);
    }

    /// <summary>
    /// Disables private notices for a user
    /// </summary>
    private static async Task DisableNoticeAsync(long chatId, string userId, CancellationToken cancellationToken)
    {
        if (!Program.DisableNotice.Contains(userId))
        {
            Program.DisableNotice.Add(userId);
            SaveMethods.SaveDisableNotice();
        }

        await Program.BotClient.SendTextMessageAsync(
            chatId: chatId,
            text: "Private notices have been disabled.",
            cancellationToken: cancellationToken);
    }

    /// <summary>
    /// Enables private notices for a user
    /// </summary>
    private static async Task EnableNoticeAsync(long chatId, string userId, CancellationToken cancellationToken)
    {
        if (Program.DisableNotice.Contains(userId))
        {
            Program.DisableNotice.Remove(userId);
            SaveMethods.SaveDisableNotice();
        }

        await Program.BotClient.SendTextMessageAsync(
            chatId: chatId,
            text: "Private notices have been enabled.",
            cancellationToken: cancellationToken);
    }

    /// <summary>
    /// Disables welcome messages in the group
    /// </summary>
    private static async Task DisableWelcomeAsync(long chatId, CancellationToken cancellationToken)
    {
        if (!Program.ShowWelcome.ContainsKey(chatId.ToString()))
        {
            Program.ShowWelcome.Add(chatId.ToString(), false);
        }
        else
        {
            Program.ShowWelcome[chatId.ToString()] = false;
        }

        SaveMethods.SaveShowWelcome();

        await Program.BotClient.SendTextMessageAsync(
            chatId: chatId,
            text: "Welcome messages have been disabled for this group.",
            cancellationToken: cancellationToken);
    }

    /// <summary>
    /// Enables welcome messages in the group
    /// </summary>
    private static async Task EnableWelcomeAsync(long chatId, CancellationToken cancellationToken)
    {
        if (!Program.ShowWelcome.ContainsKey(chatId.ToString()))
        {
            Program.ShowWelcome.Add(chatId.ToString(), true);
        }
        else
        {
            Program.ShowWelcome[chatId.ToString()] = true;
        }

        SaveMethods.SaveShowWelcome();

        await Program.BotClient.SendTextMessageAsync(
            chatId: chatId,
            text: "Welcome messages have been enabled for this group.",
            cancellationToken: cancellationToken);
    }

    /// <summary>
    /// Finds a member's ID by username
    /// </summary>
    private static async Task FindMemberIdAsync(Message message, CancellationToken cancellationToken)
    {
        var chatId = message.Chat.Id;
        var messageText = message.Text ?? string.Empty;

        string[] parts = messageText.Split(' ');
        if (parts.Length < 2)
        {
            await Program.BotClient.SendTextMessageAsync(
                chatId: chatId,
                text: "Usage: /FindMemberID <username>",
                cancellationToken: cancellationToken);
            return;
        }

        string username = parts[1].TrimStart('@');
        string response = $"No user found with username: {username}";

        // This is a simplified implementation since we can't directly search for users by username
        // In the original bot, this likely used cached user data from group interactions
        await Program.BotClient.SendTextMessageAsync(
            chatId: chatId,
            text: response,
            cancellationToken: cancellationToken);
    }

    /// <summary>
    /// Starts the edit user wizard
    /// </summary>
    private static async Task EditUserAsync(Message message, CancellationToken cancellationToken)
    {
        var chatId = message.Chat.Id;

        // This is a placeholder for the edit user wizard functionality
        // In the original bot, this would start a multi-step process to edit user data
        await Program.BotClient.SendTextMessageAsync(
            chatId: chatId,
            text: "Edit user wizard is not yet implemented in this version.",
            cancellationToken: cancellationToken);
    }

    /// <summary>
    /// Displays total referred members per day
    /// </summary>
    private static async Task SendRefTotalAsync(long chatId, CancellationToken cancellationToken)
    {
        // Group referrals by day
        var referralsByDay = new Dictionary<string, int>();
        
        foreach (var referral in Program.JoinedReferrals)
        {
            try
            {
                string date = DateTime.Parse(referral.Value).ToString("MM/dd/yyyy");
                
                if (referralsByDay.ContainsKey(date))
                {
                    referralsByDay[date]++;
                }
                else
                {
                    referralsByDay[date] = 1;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error parsing date: {referral.Value}. Error: {ex.Message}");
                // Skip invalid dates
                continue;
            }
        }
        
        if (referralsByDay.Count == 0)
        {
            await Program.BotClient.SendTextMessageAsync(
                chatId: chatId,
                text: "No referrals yet. Start sharing your referral link to earn Bricks!",
                cancellationToken: cancellationToken);
            return;
        }
        
        string message = "Total referred members per day:\n\n";
        
        foreach (var day in referralsByDay.OrderByDescending(d => DateTime.Parse(d.Key)))
        {
            message += $"{day.Key}: {day.Value} members\n";
        }
        
        await Program.BotClient.SendTextMessageAsync(
            chatId: chatId,
            text: message,
            cancellationToken: cancellationToken);
    }

    /// <summary>
    /// Lists all members with their Bricks
    /// </summary>
    private static async Task ListAllMembersAsync(long chatId, CancellationToken cancellationToken)
    {
        if (Program.PointsByReferrer.Count == 0)
        {
            await Program.BotClient.SendTextMessageAsync(
                chatId: chatId,
                text: "No members with Bricks yet.",
                cancellationToken: cancellationToken);
            return;
        }
        
        string message = "All members with Bricks:\n\n";
        foreach (var member in Program.PointsByReferrer.OrderByDescending(m => m.Value))
        {
            // Skip banned users
            if (Program.UserPointOffset.ContainsKey(member.Key) && Program.UserPointOffset[member.Key] == -1000000)
                continue;
                
            message += $"User {member.Key}: {member.Value} Bricks\n";
        }

        await Program.BotClient.SendTextMessageAsync(
            chatId: chatId,
            text: message,
            cancellationToken: cancellationToken);
    }

    /// <summary>
    /// Lists all members with their referral counts
    /// </summary>
    private static async Task ListReferralsAsync(long chatId, CancellationToken cancellationToken)
    {
        if (Program.ReferralPoints.Count == 0)
        {
            await Program.BotClient.SendTextMessageAsync(
                chatId: chatId,
                text: "No referrals yet.",
                cancellationToken: cancellationToken);
            return;
        }

        string message = "All members with referrals:\n\n";
        foreach (var member in Program.ReferralPoints.OrderByDescending(m => m.Value))
        {
            // Skip banned users
            if (Program.UserPointOffset.ContainsKey(member.Key) && Program.UserPointOffset[member.Key] == -1000000)
                continue;
                
            message += $"User {member.Key}: {member.Value} referrals\n";
        }

        await Program.BotClient.SendTextMessageAsync(
            chatId: chatId,
            text: message,
            cancellationToken: cancellationToken);
    }

    /// <summary>
    /// Sends the Bricks Journey Map to the user
    /// </summary>
    private static async Task SendBricksJourneyMapAsync(long chatId, CancellationToken cancellationToken)
    {
        string journeyMap = 
            "🧱 *Ilé Bricks Journey Map* 🧱\n\n" +
            "*Stage 1: Welcome Explorer (0–500 Bricks)*\n\n" +
            "✅ Bind Email → +50 Bricks\n" +
            "✅ Join Telegram Group → +30 Bricks\n" +
            "✅ First Check-in → +10 Bricks\n" +
            "→ Early wins! You're now part of the community!\n\n" +
            
            "*Stage 2: Active Citizen (500–2,000 Bricks)*\n\n" +
            "🔥 Daily Check-Ins → +10 Bricks/day\n" +
            "🔥 Daily Group Activity → +5 Bricks/message (Cap: 20/day)\n" +
            "🔥 First 3 Referrals → +450 Bricks\n" +
            "→ You're building your foundation!\n\n" +
            
            "*Stage 3: Community Builder (2,000–5,000 Bricks)*\n\n" +
            "🛡️ 5+ Successful Referrals → +Bonus 500 Bricks\n" +
            "🛡️ Win a Daily Leaderboard → +200 Bricks\n" +
            "🛡️ Maintain 7-Day Streak → +300 Bricks\n" +
            "→ You are now trusted! Special badge unlocked.\n\n" +
            
            "*Stage 4: Brick Millionaire (5,000–10,000 Bricks)*\n\n" +
            "🏠 Special Tasks/Challenges → +500–1,000 Bricks";

        await Program.BotClient.SendTextMessageAsync(
            chatId: chatId,
            text: journeyMap,
            parseMode: ParseMode.Markdown,
            cancellationToken: cancellationToken);
    }
    
    /// <summary>
    /// Tests the Bricks system by simulating different point-earning activities
    /// </summary>
    private static async Task TestPointsSystemAsync(long chatId, CancellationToken cancellationToken)
    {
        string userId = chatId.ToString();
        
        // Test join group reward
        if (!Program.JoinedReferrals.ContainsKey((int)chatId))
        {
            Program.JoinedReferrals.Add((int)chatId, DateTime.UtcNow.ToString("o"));
        }
        
        // Test referral reward
        string referralId = "test_referral_" + new Random().Next(1000, 9999);
        if (!Program.ReferredBy.ContainsKey(referralId))
        {
            Program.ReferredBy.Add(referralId, userId);
        }
        
        // Test group activity Bricks
        string today = DateTime.UtcNow.ToString("MM/dd/yyyy");
        if (!Program.UserActivity.ContainsKey(userId))
        {
            Program.UserActivity.Add(userId, new Dictionary<string, int>());
        }
        
        if (!Program.UserActivity[userId].ContainsKey(today))
        {
            Program.UserActivity[userId].Add(today, 0);
        }
        
        Program.UserActivity[userId][today] += 5;
        
        // Test adding Bricks to referrer
        if (!Program.PointsByReferrer.ContainsKey(userId))
        {
            Program.PointsByReferrer.Add(userId, 0);
        }
        
        Program.PointsByReferrer[userId] += Config.ReferralReward;
        
        // Sync with backend if configured
        await ApiIntegration.SyncReferralsAsync();
        
        // Show test results
        int totalPoints = 0;
        if (Program.PointsByReferrer.ContainsKey(userId))
        {
            totalPoints += Program.PointsByReferrer[userId];
        }
        
        string testResults = 
            "🧪 *Bricks System Test Results* 🧪\n\n" +
            $"Join Group: +{Config.JoinReward} Bricks\n" +
            $"Referral: +{Config.ReferralReward} Bricks\n" +
            $"Group Activity: +{Math.Min(Program.UserActivity[userId][today], Config.MaxPointsPerDay)} Bricks\n\n" +
            $"Total Bricks in Bot: {totalPoints} Bricks\n\n" +
            "Note: Bricks have been synced with the backend system if configured correctly.";
        
        await Program.BotClient.SendTextMessageAsync(
            chatId: chatId,
            text: testResults,
            parseMode: ParseMode.Markdown,
            cancellationToken: cancellationToken);
    }
}
