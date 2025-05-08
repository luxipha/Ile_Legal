using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
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

            // Ensure user exists in the database whenever they interact with the bot
            await EnsureUserExistsAsync(userId, callbackQuery.From, cancellationToken);

            Logging.AddToLog($"Callback query from {userId}: {callbackQuery.Data}");

            // Acknowledge the callback query
            await Program.BotClient.AnswerCallbackQueryAsync(
                callbackQuery.Id,
                cancellationToken: cancellationToken
            );

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
            else if (callbackQuery.Data.StartsWith("getreferral"))
            {
                await HandleGetReferralCallback(callbackQuery, cancellationToken);
            }
            else if (callbackQuery.Data.StartsWith("joingroup"))
            {
                await HandleJoinGroupCallback(callbackQuery, cancellationToken);
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
    /// Handles the join group button callback
    /// </summary>
    private static async Task HandleJoinGroupCallback(CallbackQuery callbackQuery, CancellationToken cancellationToken)
    {
        try
        {
            var chatId = callbackQuery.Message?.Chat.Id;
            var userId = callbackQuery.From.Id.ToString();

            if (chatId == null)
                return;

            // Ensure user exists in the database
            await EnsureUserExistsAsync(userId, callbackQuery.From, cancellationToken);

            // Send the group link
            await Program.BotClient.SendTextMessageAsync(
                chatId: chatId.Value,
                text: $"Great! Click the button below to join the Ile Community group:",
                replyMarkup: new InlineKeyboardMarkup(
                    InlineKeyboardButton.WithUrl("Join Ile Community", Config.LinkToGroup)
                ),
                cancellationToken: cancellationToken
            );
        }
        catch (Exception ex)
        {
            Logging.AddToLog($"Error handling join group callback: {ex.Message}");
            Console.WriteLine($"Error handling join group callback: {ex.Message}");
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

            // Call the same method as /myPoints to ensure a single source of truth
            await SendPointsInfoAsync(chatId.Value, userId, cancellationToken);
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
                             "/disableNotice - (Private Chat Only) Turn off private bot notices.\n" +
                             "/enableNotice - (Private Chat Only) Turn on private bot notices.\n" +
                             "/getRefLink - (Private Chat Only) Generates your referral code for the program.\n" +
                             "/help - Sends a list of available commands.\n" +
                             "/journey - View the Ilé Bricks Journey Map with rewards.\n" +
                             "/listAll - (Private Chat Only) Full list of all members with Bricks.\n" +
                             "/listRef - (Private Chat Only) Full list of all members referral count.\n" +
                             "/myID - Gets your Telegram user ID.\n" +
                             "/myPoints - Gets your current Bricks total.\n" +
                             "/refTotal - Displays a list of total referred members per day.\n" +
                             "/top10 - Displays the names and Bricks of the top 10 ranks in the referral program";

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
    /// Handles the getreferral callback
    /// </summary>
    private static async Task HandleGetReferralCallback(CallbackQuery callbackQuery, CancellationToken cancellationToken)
    {
        try
        {
            var chatId = callbackQuery.Message?.Chat.Id;
            var userId = callbackQuery.From.Id.ToString();
            var user = callbackQuery.From;

            if (chatId == null)
                return;

            await SendReferralLinkAsync(chatId.Value, userId, user, cancellationToken);
        }
        catch (Exception ex)
        {
            Logging.AddToLog($"Error in HandleGetReferralCallback: {ex.Message}");
        }
    }

    /// <summary>
    /// Handles messages in private chats
    /// </summary>
    private static async Task HandlePrivateMessageAsync(Message message, CancellationToken cancellationToken)
    {
        try
        {
            long chatId = message.Chat.Id;
            string userId = message.From.Id.ToString();
            string messageText = message.Text ?? string.Empty;

            // Ensure user exists in the database whenever they interact with the bot
            await EnsureUserExistsAsync(userId, message.From, cancellationToken);

            // Log received message for debugging
            Console.WriteLine($"Received a '{messageText}' message in private chat {chatId} from user {userId}.");

            // Check if user is awaiting reply
            if (Program.AwaitingReply.Contains(userId))
            {
                // Handle password check
                string? result = Program.CheckPassword(messageText, userId);
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
                else if (result != null && result.StartsWith("wrong_"))
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

            // Handle commands
            if (messageText.StartsWith("/"))
            {
                if (messageText.StartsWith("/start"))
                {
                    // Check if this is a referral
                    if (messageText.Contains("="))
                    {
                        // Format: /start=XXXXX
                        string[] parts = messageText.Split('=');
                        if (parts.Length > 1)
                        {
                            string refCode = parts[1];
                            await HandleReferralAsync(message, refCode, cancellationToken);
                        }
                        else
                        {
                            // Invalid referral format, show regular welcome
                            await SendWelcomeMessageAsync(chatId, userId, cancellationToken);
                        }
                    }
                    else if (messageText.Contains(" "))
                    {
                        // Format: /start XXXXX
                        string[] parts = messageText.Split(' ');
                        if (parts.Length > 1)
                        {
                            string refCode = parts[1];
                            await HandleReferralAsync(message, refCode, cancellationToken);
                        }
                        else
                        {
                            // Invalid referral format, show regular welcome
                            await SendWelcomeMessageAsync(chatId, userId, cancellationToken);
                        }
                    }
                    else
                    {
                        // Regular start command without referral
                        await SendWelcomeMessageAsync(chatId, userId, cancellationToken);
                    }
                }
                else if (messageText == "/help")
                {
                    await SendHelpMessageAsync(chatId, cancellationToken);
                }
                else if (messageText == "/myID")
                {
                    await SendUserIdAsync(chatId, userId, cancellationToken);
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
                else if (messageText == "/leaderboard" || messageText == "/top10")
                {
                    await SendLeaderboardAsync(chatId, cancellationToken);
                }
                else if (messageText == "/journey" || messageText == "/rewards" || messageText == "/map")
                {
                    await SendBricksJourneyMapAsync(chatId, cancellationToken);
                }
                else if (messageText == "/disableNotice")
                {
                    await DisableNoticeAsync(chatId, userId, cancellationToken);
                }
                else if (messageText == "/enableNotice")
                {
                    await EnableNoticeAsync(chatId, userId, cancellationToken);
                }
                else if (messageText == "/listAll")
                {
                    await SendAllMembersListAsync(chatId, cancellationToken);
                }
                else if (messageText == "/listRef")
                {
                    await SendReferralCountListAsync(chatId, cancellationToken);
                }
                else if (messageText == "/refTotal")
                {
                    await SendRefTotalAsync(chatId, cancellationToken);
                }
            }
        }
        catch (Exception ex)
        {
            Logging.AddToLog($"Error in HandlePrivateMessageAsync: {ex.Message}");
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
            else if (messageText == "/myPoints")
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
        // Get user information from Telegram
        var user = await Program.BotClient.GetChatAsync(chatId, cancellationToken);
        string userName = !string.IsNullOrEmpty(user.FirstName) ? user.FirstName : "there";

        string botName = GetBotNameFromConfig();

        string welcomeMessage = $"Hello {userName}! 👋\n\nWelcome to {botName}!\n\n" +
                               $"This bot helps you track referrals and earn Bricks.\n\n" +
                               $"• Get your referral link and share it with friends\n" +
                               $"• When they join using your link, you get Bricks\n" +
                               $"• Earn more Bricks when your referrals are active\n" +
                               $"• Compete for the top position on the leaderboard\n\n" +
                               $"Type /help to see available commands.";

        // Create buttons with group link and help
        var groupButton = new InlineKeyboardMarkup(new[]
        {
            new[]
            {
                InlineKeyboardButton.WithUrl("🏢 Join Ile Community", Config.LinkToGroup)
            },
            new[]
            {
                InlineKeyboardButton.WithCallbackData("🔗 Get My Referral Link", "getreferral"),
                InlineKeyboardButton.WithCallbackData("❓ How It Works", "help")
            }
        });

        await Program.BotClient.SendTextMessageAsync(
            chatId: chatId,
            text: welcomeMessage,
            replyMarkup: groupButton,
            cancellationToken: cancellationToken);

        // Mark that we've shown the welcome message
        if (!Program.ShowWelcome.ContainsKey(userId))
        {
            Program.ShowWelcome.Add(userId, true);
            SaveMethods.SaveShowWelcome();
        }

        // Also save the user's name to MongoDB if available
        if (Program.MongoDb != null && !string.IsNullOrEmpty(user.FirstName))
        {
            try
            {
                // await Program.MongoDb.UpdateUserNameAsync(userId, user.FirstName, user.LastName ?? ""); // Temporarily commented out
                Logging.AddToLog($"Updated user {userId} name to {user.FirstName} {user.LastName ?? ""}");
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error updating user name: {ex.Message}");
            }
        }
    }

    /// <summary>
    /// Sends help message with available commands
    /// </summary>
    private static async Task SendHelpMessageAsync(long chatId, CancellationToken cancellationToken)
    {
        string helpMessage = "Available commands:\n" +
                             "/disableNotice - (Private Chat Only) Turn off private bot notices.\n" +
                             "/enableNotice - (Private Chat Only) Turn on private bot notices.\n" +
                             "/getRefLink - (Private Chat Only) Generates your referral code for the program.\n" +
                             "/help - Sends a list of available commands.\n" +
                             "/journey - View the Ilé Bricks Journey Map with rewards.\n" +
                             "/listAll - (Private Chat Only) Full list of all members with Bricks.\n" +
                             "/listRef - (Private Chat Only) Full list of all members referral count.\n" +
                             "/myID - Gets your Telegram user ID.\n" +
                             "/myPoints - Gets your current Bricks total.\n" +
                             "/refTotal - Displays a list of total referred members per day.\n" +
                             "/top10 - Displays the names and Bricks of the top 10 ranks in the referral program";

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
        try
        {
            // Ensure user exists in the database
            await EnsureUserExistsAsync(userId, user, cancellationToken);

            string referralLink = "";
            string botName = GetBotNameFromConfig();

            // Try to get referral link from MongoDB first
            if (Program.MongoDb != null)
            {
                try
                {
                    var refLink = await Program.MongoDb.GetRefLinkByUserIdAsync(userId);
                    if (refLink == null)
                    {
                        // Generate a new referral link
                        var chat = await Program.BotClient.GetChatAsync(long.Parse(userId));
                        var telegramUser = new Telegram.Bot.Types.User
                        {
                            Id = long.Parse(userId),
                            FirstName = chat.FirstName,
                            LastName = chat.LastName,
                            Username = chat.Username
                        };
                        referralLink = Program.GetRefLink(telegramUser);

                        // Store the new referral link in MongoDB
                        var newRefLink = new Models.RefLinkModel
                        {
                            UserId = userId,
                            RefCode = referralLink.Split('=').Last(),
                            CreatedAt = DateTime.UtcNow
                        };

                        await Program.MongoDb.CreateRefLinkAsync(newRefLink);
                        Logging.AddToLog($"Created new referral link in MongoDB for user {userId}");
                    }
                    else
                    {
                        // Use existing referral link
                        referralLink = $"{Config.LinkToBot}?start={refLink.RefCode}";
                    }
                }
                catch (Exception ex)
                {
                    Logging.AddToLog($"Error getting points from API: {ex.Message}. Falling back to local data.");

                    // Fallback to local data
                    if (Program.PointsByReferrer.ContainsKey(userId))
                    {
                        referralLink = Program.GetRefLink(user);
                    }
                }
            }
            else
            {
                // MongoDB not available, use in-memory/file-based referral link
                referralLink = Program.GetRefLink(user);
            }

            // Create inline keyboard with share button
            var inlineKeyboard = new InlineKeyboardMarkup(new[]
            {
                new[]
                {
                    InlineKeyboardButton.WithSwitchInlineQueryCurrentChat("📲 Share with Friends", "Join Ile to earn tokens and invest in property! Use my referral link:")
                }
            });

            // Send referral link message
            await Program.BotClient.SendTextMessageAsync(
                chatId: chatId,
                text: $"🔗 *Your {botName} Referral Link*\n\n`{referralLink}`\n\n" +
                      $"Share this link with your friends. When they join using your link, you'll earn {Config.ReferralReward} Bricks!\n\n" +
                      $"You can also use the button below to easily share your link.",
                parseMode: ParseMode.Markdown,
                disableWebPagePreview: true,
                replyMarkup: inlineKeyboard,
                cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            Logging.AddToLog($"Error sending referral link: {ex.Message}");
            await Program.BotClient.SendTextMessageAsync(
                chatId: chatId,
                text: "Sorry, I couldn't generate your referral link right now. Please try again later.",
                cancellationToken: cancellationToken);
        }
    }

    /// <summary>
    /// Sends user's Bricks information
    /// </summary>
    private static async Task SendPointsInfoAsync(long chatId, string userId, CancellationToken cancellationToken)
    {
        int points = 0;
        int referralCount = 0;

        // Try to get points from MongoDB first
        if (Program.MongoDb != null)
        {
            var user = await Program.MongoDb.GetUserAsync(userId);
            if (user != null)
            {
                // Use the BricksTotal property which handles the nested bricks.total field
                points = user.BricksTotal;

                // Use the Referrals.Count for referral count
                referralCount = user.Referrals?.Count ?? 0;
            }
        }

        // If not found in MongoDB or MongoDB is not available, fall back to memory cache
        if (points == 0 && Program.PointTotals.ContainsKey(userId))
        {
            points = Program.PointTotals[userId];
        }

        if (referralCount == 0 && Program.ReferralPoints.ContainsKey(userId))
        {
            referralCount = Program.ReferralPoints[userId] / Config.ReferralReward;
        }

        if (points == 0)
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
            string referralInfo = referralCount > 0
                ? $"You have referred {referralCount} people to Ile.\n\n"
                : "";

            await Program.BotClient.SendTextMessageAsync(
                chatId: chatId,
                text: $"You have {points} Bricks.\n\n" +
                      referralInfo +
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
        string referredName = message.From?.FirstName ?? "Telegram User";

        // Find the referrer - try MongoDB first, then fallback to memory
        string? referrerId = null;

        if (Program.MongoDb != null)
        {
            // Try to find the referral code in MongoDB
            var refLink = await Program.MongoDb.GetRefLinkByCodeAsync(refCode);
            if (refLink != null)
            {
                referrerId = refLink.UserId;
            }
        }

        // If not found in MongoDB, check in-memory cache
        if (referrerId == null)
        {
            foreach (var entry in Program.RefLinks)
            {
                if (entry.Value == refCode)
                {
                    referrerId = entry.Key;
                    break;
                }
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

        // Check if user is already referred - try MongoDB first, then fallback to memory
        bool alreadyReferred = false;

        if (Program.MongoDb != null)
        {
            var existingReferral = await Program.MongoDb.GetReferralByReferredIdAsync(userId);
            alreadyReferred = existingReferral != null;
        }

        // If not checked in MongoDB or not found, check in-memory cache
        if (!alreadyReferred && Program.ReferredBy.ContainsKey(userId))
        {
            alreadyReferred = true;
        }

        if (alreadyReferred)
        {
            await Program.BotClient.SendTextMessageAsync(
                chatId: chatId,
                text: "You have already been referred by someone else.",
                cancellationToken: cancellationToken);
            return;
        }

        // Add referral to memory cache
        Program.ReferredBy[userId] = referrerId;

        bool savedToMongoDB = false;

        // Create referral in MongoDB if available
        if (Program.MongoDb != null)
        {
            try
            {
                // 1. Create referral document in referrals collection
                var referral = new Models.ReferralModel
                {
                    ReferrerId = referrerId,
                    ReferredId = userId,
                    Points = Config.ReferralReward,
                    Timestamp = DateTime.UtcNow,
                    Type = "referral"
                };

                await Program.MongoDb.CreateReferralAsync(referral);

                // 2. Add referral to user's referrals array and update bricks
                await Program.MongoDb.AddReferralToUserAsync(
                    referrerId,
                    userId,
                    referredName,
                    Config.ReferralReward);

                savedToMongoDB = true;
                Logging.AddToLog($"Referral saved to MongoDB: {userId} referred by {referrerId}");
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error saving referral to MongoDB: {ex.Message}");
                // Fall back to file storage
                savedToMongoDB = false;
            }
        }

        // Fall back to file storage if MongoDB save failed or not available
        if (!savedToMongoDB)
        {
            // Add referral points to memory cache
            if (Program.ReferralPoints.ContainsKey(referrerId))
            {
                Program.ReferralPoints[referrerId] += Config.ReferralReward;
            }
            else
            {
                Program.ReferralPoints.Add(referrerId, Config.ReferralReward);
            }

            // Save to files
            SaveMethods.SaveReferredBy();
            SaveMethods.SaveReferralPoints();
        }

        // Update points
        Program.UpdatePointTotals();

        var groupButton = new InlineKeyboardMarkup(new[]
        {
            new[]
            {
                InlineKeyboardButton.WithUrl("🏢 Join Ile Community", Config.LinkToGroup)
            },
            new[]
            {
                InlineKeyboardButton.WithCallbackData("🔗 Get My Referral Link", "getreferral"),
                InlineKeyboardButton.WithCallbackData("❓ How It Works", "help")
            }
        });

        await Program.BotClient.SendTextMessageAsync(
            chatId: chatId,
            text: $"🎉 *Welcome to Ile!* You've been referred by a community member.\n\n" +
                  $"*Join our Telegram group* to:\n" +
                  $"• Discuss property investment opportunities\n" +
                  $"• Earn Ile Tokens for participation\n" +
                  $"• Connect with like-minded investors\n\n" +
                  $"After joining, you can get your own referral link to invite others and earn more tokens!",
            parseMode: ParseMode.Markdown,
            replyMarkup: groupButton,
            cancellationToken: cancellationToken);

        // Notify referrer
        try
        {
            await Program.BotClient.SendTextMessageAsync(
                chatId: long.Parse(referrerId),
                text: $"A new user has joined using your referral link! You earned {Config.ReferralReward} Bricks.",
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
    private static Task UpdateUserActivityAsync(Message message, CancellationToken cancellationToken)
    {
        var userId = message.From?.Id.ToString() ?? "unknown";
        var messageText = message.Text ?? string.Empty;

        // Check if message is long enough to count for points
        if (messageText.Length < Config.ThresholdForMessagePoint)
            return Task.CompletedTask;

        // Check if user was referred by someone
        if (!Program.ReferredBy.ContainsKey(userId))
            return Task.CompletedTask;

        string referrerId = Program.ReferredBy[userId];

        // Get current date
        string today = DateTime.Now.ToString("MM/dd/yyyy");

        // Check if today is in the campaign period
        if (!Program.CampaignDays.Contains(today))
            return Task.CompletedTask;

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
            Dictionary<string, int>? tempActivityDict = Program.CreateUserActivityDictionary(userId);
            if (tempActivityDict is null)
                return Task.CompletedTask;

            userActivityPerDay = tempActivityDict;

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

        return Task.CompletedTask;
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
        // We need to get join dates from a different source since JoinedReferrals is now a bool flag
        // For now, we'll skip this part as it's not critical for the MongoDB integration
        /*
        foreach (var referral in Program.JoinedReferrals)
        {
            try
            {
                // This would need to be updated to use a proper date source
                string date = DateTime.Now.ToString("MM/dd/yyyy");
                
                if (referralsByDay.ContainsKey(date))
        */
        await Program.BotClient.SendTextMessageAsync(
            chatId: chatId,
            text: "This feature is currently not available.",
            cancellationToken: cancellationToken);
    }

    /// <summary>
    /// Lists all members with their Bricks
    /// </summary>
    private static async Task ListAllMembersAsync(long chatId, CancellationToken cancellationToken)
    {
        try
        {
            var sb = new StringBuilder();
            sb.AppendLine("*All Members with Bricks:*");
            sb.AppendLine();

            if (Program.PointsByReferrer.Count == 0)
            {
                sb.AppendLine("No members with Bricks yet.");
            }
            else
            {
                // Sort by points (descending)
                var sortedMembers = Program.PointsByReferrer
                    .OrderByDescending(x => x.Value)
                    .ToList();

                for (int i = 0; i < sortedMembers.Count; i++)
                {
                    var member = sortedMembers[i];
                    string username = await GetUsernameAsync(member.Key);
                    sb.AppendLine($"{i + 1}. {username}: {member.Value} Bricks");
                }
            }

            await Program.BotClient.SendTextMessageAsync(
                chatId: chatId,
                text: sb.ToString(),
                parseMode: ParseMode.Markdown,
                cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            Logging.AddToLog($"Error in ListAllMembersAsync: {ex.Message}");
            Console.WriteLine($"Error in ListAllMembersAsync: {ex.Message}");
        }
    }

    /// <summary>
    /// Lists all members with their referral count
    /// </summary>
    private static async Task ListReferralsAsync(long chatId, CancellationToken cancellationToken)
    {
        try
        {
            var sb = new StringBuilder();
            sb.AppendLine("*All Members with Referral Count:*");
            sb.AppendLine();

            if (Program.ReferralPoints.Count == 0)
            {
                sb.AppendLine("No members with referrals yet.");
            }
            else
            {
                // Sort by referral count (descending)
                var sortedMembers = Program.ReferralPoints
                    .OrderByDescending(x => x.Value)
                    .ToList();

                for (int i = 0; i < sortedMembers.Count; i++)
                {
                    var member = sortedMembers[i];
                    string username = await GetUsernameAsync(member.Key);
                    int referralCount = member.Value / Config.ReferralReward; // Convert points to count
                    sb.AppendLine($"{i + 1}. {username}: {referralCount} referrals");
                }
            }

            await Program.BotClient.SendTextMessageAsync(
                chatId: chatId,
                text: sb.ToString(),
                parseMode: ParseMode.Markdown,
                cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            Logging.AddToLog($"Error in ListReferralsAsync: {ex.Message}");
            Console.WriteLine($"Error in ListReferralsAsync: {ex.Message}");
        }
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
            $"✅ Join Telegram Group → +{Config.JoinReward} Bricks\n" +
            "✅ First Check-in → +10 Bricks\n" +
            "→ Early wins! You're now part of the community!\n\n" +

            "*Stage 2: Active Citizen (500–2,000 Bricks)*\n\n" +
            "🔥 Daily Check-Ins → +10 Bricks/day\n" +
            $"🔥 Daily Group Activity → +5 Bricks/message (Cap: {Config.MaxPointsPerDay}/day)\n" +
            $"🔥 First 3 Referrals → +{Config.ReferralReward * 3} Bricks\n" +
            "→ You're building your foundation!\n\n" +

            "*Stage 3: Community Builder (2,000–5,000 Bricks)*\n\n" +
            "🛡️ 5+ Successful Referrals → +Bonus 500 Bricks\n" +
            $"🛡️ Win a Daily Leaderboard → +{Config.LeaderboardReward} Bricks\n" +
            $"🛡️ Maintain 7-Day Streak → +{Config.StreakReward} Bricks\n" +
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
    /// Sends a list of all members with their Bricks
    /// </summary>
    private static async Task SendAllMembersListAsync(long chatId, CancellationToken cancellationToken)
    {
        await ListAllMembersAsync(chatId, cancellationToken);
    }

    /// <summary>
    /// Sends a list of all members with their referral count
    /// </summary>
    private static async Task SendReferralCountListAsync(long chatId, CancellationToken cancellationToken)
    {
        await ListReferralsAsync(chatId, cancellationToken);
    }

    /// <summary>
    /// Gets a username from a user ID
    /// </summary>
    private static async Task<string> GetUsernameAsync(string userId)
    {
        try
        {
            // Try to get the chat from Telegram
            var chat = await Program.BotClient.GetChatAsync(long.Parse(userId));

            // Return username or first name
            if (!string.IsNullOrEmpty(chat.Username))
                return "@" + chat.Username;
            else if (!string.IsNullOrEmpty(chat.FirstName))
                return chat.FirstName;
            else
                return userId;
        }
        catch
        {
            // If we can't get the chat, just return the ID
            return userId;
        }
    }

    /// <summary>
    /// Extracts the bot name from Config.LinkToBot
    /// </summary>
    private static string GetBotNameFromConfig()
    {
        string botName = "Telegram Bot"; // Default fallback

        if (!string.IsNullOrEmpty(Config.LinkToBot))
        {
            try
            {
                // Extract bot name from the URL (e.g., https://telegram.me/IleReferBot -> IleReferBot)
                Uri uri = new Uri(Config.LinkToBot);
                string path = uri.AbsolutePath.TrimStart('/');
                if (!string.IsNullOrEmpty(path))
                {
                    botName = path;
                }
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error extracting bot name from config: {ex.Message}");
                Console.WriteLine($"Error extracting bot name from config: {ex.Message}");
            }
        }

        return botName;
    }

    /// <summary>
    /// Handles a request for a referral link
    /// </summary>
    private static async Task HandleReferralLinkRequestAsync(Message message, CancellationToken cancellationToken)
    {
        try
        {
            long chatId = message.Chat.Id;
            string userId = message.From.Id.ToString();

            // Ensure user exists in the database
            await EnsureUserExistsAsync(userId, message.From, cancellationToken);

            // Get or generate referral link
            string referralLink = await GetReferralLinkAsync(userId);

            // Send the referral link
            await Program.BotClient.SendTextMessageAsync(
                chatId: chatId,
                text: $"Here's your referral link:\n\n{referralLink}\n\nShare this link with your friends. When they join the Ile Community using your link, you'll earn {Config.ReferralReward} Bricks!",
                disableWebPagePreview: true,
                cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            Logging.AddToLog($"Error handling referral link request: {ex.Message}");
        }
    }

    /// <summary>
    /// Ensures a user exists in the database
    /// </summary>
    private static async Task EnsureUserExistsAsync(string userId, User telegramUser, CancellationToken cancellationToken)
    {
        try
        {
            if (Program.MongoDb == null)
            {
                Logging.AddToLog("MongoDB not initialized. Cannot ensure user exists.");
                return;
            }

            // Check if user already exists
            var user = await Program.MongoDb.GetUserAsync(userId);
            if (user == null || string.IsNullOrEmpty(user.Id))
            {
                // Create new user with proper nested bricks structure
                var newUser = new Models.UserModel
                {
                    TelegramId = userId,
                    FirstName = telegramUser.FirstName,
                    LastName = telegramUser.LastName,
                    Username = telegramUser.Username,
                    Email = $"telegram-{userId}@placeholder.com",
                    Balance = 0,
                    Bricks = new Models.BricksModel { Total = 0 },
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    ShowWelcome = true
                };

                await Program.MongoDb.CreateUserAsync(newUser);
                Logging.AddToLog($"Created new user in MongoDB: {userId} ({telegramUser.FirstName} {telegramUser.LastName})");
            }
        }
        catch (Exception ex)
        {
            Logging.AddToLog($"Error ensuring user exists: {ex.Message}");
        }
    }

    /// <summary>
    /// Gets a referral link for a user
    /// </summary>
    private static async Task<string> GetReferralLinkAsync(string userId)
    {
        string referralLink = "";
        
        // Try to get referral link from MongoDB first
        if (Program.MongoDb != null)
        {
            try
            {
                var refLink = await Program.MongoDb.GetRefLinkByUserIdAsync(userId);
                if (refLink == null)
                {
                    // Generate a new referral link
                    var chat = await Program.BotClient.GetChatAsync(long.Parse(userId));
                    var telegramUser = new Telegram.Bot.Types.User
                    {
                        Id = long.Parse(userId),
                        FirstName = chat.FirstName,
                        LastName = chat.LastName,
                        Username = chat.Username
                    };
                    referralLink = Program.GetRefLink(telegramUser);
                    
                    // Store the new referral link in MongoDB
                    var newRefLink = new Models.RefLinkModel
                    {
                        UserId = userId,
                        RefCode = referralLink.Split('=').Last(),
                        CreatedAt = DateTime.UtcNow
                    };
                    
                    await Program.MongoDb.CreateRefLinkAsync(newRefLink);
                    Logging.AddToLog($"Created new referral link in MongoDB for user {userId}");
                }
                else
                {
                    // Use existing referral link
                    referralLink = $"https://t.me/{Program.BotClient.GetMeAsync().Result.Username}?start={refLink.RefCode}";
                    Logging.AddToLog($"Retrieved existing referral link from MongoDB for user {userId}");
                }
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error getting referral link from MongoDB: {ex.Message}. Falling back to in-memory data.");
                referralLink = "";
            }
        }
        
        // If MongoDB failed or not available, use in-memory/file-based referral link
        if (string.IsNullOrEmpty(referralLink))
        {
            var user = await Program.BotClient.GetChatAsync(long.Parse(userId));
            var telegramUser = new Telegram.Bot.Types.User
            {
                Id = long.Parse(userId),
                FirstName = user.FirstName,
                LastName = user.LastName,
                Username = user.Username
            };
            referralLink = Program.GetRefLink(telegramUser);
        }
        
        return referralLink;
    }
}
