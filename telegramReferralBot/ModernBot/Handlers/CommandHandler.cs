using System;
using System.Threading;
using System.Threading.Tasks;
using Telegram.Bot;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;
using TelegramReferralBot.Services;
using TelegramReferralBot.Utils;

namespace TelegramReferralBot.Handlers
{
    public class CommandHandler
    {
        private readonly ITelegramBotClient _botClient;
        private readonly ReferralService _referralService;
        private readonly PointsService _pointsService;
        private readonly MongoDbService _mongoDb;
        private readonly ILogger<CommandHandler> _logger;
        private readonly string _adminUserId = "5962815632"; // Abisoye's Telegram ID

        public CommandHandler(
            ITelegramBotClient botClient,
            ReferralService referralService,
            PointsService pointsService,
            MongoDbService mongoDb,
            ILogger<CommandHandler> logger)
        {
            _botClient = botClient;
            _referralService = referralService;
            _pointsService = pointsService;
            _mongoDb = mongoDb;
            _logger = logger;
        }

        /// <summary>
        /// Handles the /start command
        /// </summary>
        public async Task HandleStartCommandAsync(Message message, CancellationToken cancellationToken)
        {
            Console.WriteLine($"[DEBUG] START COMMAND: Processing /start command");
            
            var userId = message.From.Id.ToString();
            var chatId = message.Chat.Id;
            var username = message.From.Username ?? "Unknown";
            var firstName = message.From.FirstName ?? "User";
            
            Console.WriteLine($"[DEBUG] START COMMAND: From user {userId} ({username}), chat {chatId}");
            
            // Check if this is a referral
            string[] args = message.Text.Split(' ');
            bool isReferral = args.Length > 1;
            string? referralCode = isReferral ? args[1] : null;
            
            Console.WriteLine($"[DEBUG] START COMMAND: Is referral: {isReferral}, Code: {referralCode ?? "None"}");
            
            // Check if user exists in MongoDB
            bool isNewUser = true;
            try
            {
                Console.WriteLine($"[DEBUG] DB REQUEST: Checking if user {userId} exists");
                var dbUser = await _pointsService.GetUserAsync(userId);
                isNewUser = dbUser == null;
                
                if (isNewUser)
                {
                    Console.WriteLine($"[DEBUG] DB RESPONSE: User {userId} not found, will create new user");
                    
                    // Create new user in the database
                    Console.WriteLine($"[DEBUG] DB REQUEST: Creating new user {userId}");
                    
                    // Create a new user with proper placeholders
                    var newUser = new Models.UserModel
                    {
                        TelegramId = userId,
                        Username = username,
                        FirstName = firstName,
                        LastName = message.From.LastName,
                        Email = $"telegram_{userId}@placeholder.ile",
                        ReferralCode = $"ref_{userId}_{DateTime.UtcNow.Ticks}", // Unique referral code
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        Bricks = new Models.BricksModel { Total = 0 },
                        Balance = 0
                    };
                    
                    try
                    {
                        await _pointsService.CreateUserAsync(newUser);
                        Console.WriteLine($"[DEBUG] DB RESPONSE: Successfully created user {userId}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[DEBUG] DB ERROR: Failed to create user {userId}: {ex.Message}");
                        _logger.LogError($"Failed to create user {userId}: {ex.Message}");
                    }
                }
                else
                {
                    Console.WriteLine($"[DEBUG] DB RESPONSE: User {userId} found in database");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] DB ERROR: Error checking user existence: {ex.Message}");
                _logger.LogError($"Error checking user existence: {ex.Message}");
            }
            
            // Handle referral if present
            if (isReferral)
            {
                Console.WriteLine($"[DEBUG] REFERRAL: Processing referral code {referralCode} for user {userId}");
                await _referralService.HandleReferralClickAsync(userId, referralCode!);
            }
            
            // For new users who start directly (not through referral), award JOIN_REWARD
            if (isNewUser && !isReferral)
            {
                Console.WriteLine($"[DEBUG] POINTS: Awarding join bonus to new user {userId} who started directly");
                await _pointsService.AwardJoinBonusAsync(userId);
            }
            
            // Send appropriate welcome message
            if (isNewUser)
            {
                if (isReferral)
                {
                    Console.WriteLine($"[DEBUG] BOT: Sending new user with referral message to {userId}");
                    await SendNewUserWithReferralMessageAsync(chatId, firstName, cancellationToken);
                }
                else
                {
                    Console.WriteLine($"[DEBUG] BOT: Sending new user message to {userId}");
                    await SendNewUserMessageAsync(chatId, firstName, cancellationToken);
                }
            }
            else
            {
                Console.WriteLine($"[DEBUG] BOT: Sending returning user message to {userId}");
                await SendReturningUserMessageAsync(chatId, firstName, cancellationToken);
            }
        }

        /// <summary>
        /// Handles the /myPoints command
        /// </summary>
        public async Task HandleMyPointsCommandAsync(Message message, CancellationToken cancellationToken)
        {
            Console.WriteLine($"[DEBUG] COMMAND: /mypoints command received");
            
            // Check if message.From is null (this can happen with callback queries)
            if (message.From == null)
            {
                Console.WriteLine($"[DEBUG] ERROR: message.From is null in HandleMyPointsCommandAsync");
                _logger.LogError("message.From is null in HandleMyPointsCommandAsync");
                return;
            }
            
            var userId = message.From.Id.ToString();
            var chatId = message.Chat.Id;
            var username = message.From.Username ?? "Unknown";
            
            Console.WriteLine($"[DEBUG] COMMAND: /mypoints requested by user {userId} ({username}) in chat {chatId}");
            
            // Log message details for debugging
            Console.WriteLine($"[DEBUG] MESSAGE DETAILS: MessageId: {message.MessageId}, ChatType: {message.Chat.Type}");
            if (message.ReplyToMessage != null)
            {
                Console.WriteLine($"[DEBUG] MESSAGE DETAILS: Is reply to message {message.ReplyToMessage.MessageId}");
            }
            
            // Get user's points and user data
            Console.WriteLine($"[DEBUG] COMMAND: Getting points for user {userId}");
            int points = await _pointsService.GetPointsAsync(userId);
            var user = await _mongoDb.GetUserByIdAsync(userId);
            Console.WriteLine($"[DEBUG] COMMAND: User {userId} has {points} Bricks");
            
            string response;
            (string stageName, int stageNumber, int nextStageThreshold) = GetUserStageInfo(points);
            string progressBar = GenerateProgressBar(points, stageNumber);

            if (points == 0)
            {
                Console.WriteLine($"[DEBUG] COMMAND: User {userId} has 0 Bricks, sending no-bricks message");
                response = "You don't have any Bricks yet. You can earn Bricks by:\n\n" +
                           "• Referring new members to the group\n" +
                           "• Being active in the group\n" +
                           "• Completing special tasks\n\n" +
                           "Type /getRefLink in a private chat with me to get your referral link and start earning Bricks!";
            }
            else
            {
                Console.WriteLine($"[DEBUG] COMMAND: User {userId} has {points} Bricks, sending bricks message with stage");
                
                // Calculate progress to next stage
                int currentStageThreshold = GetStageThreshold(stageNumber - 1);
                int pointsInCurrentStage = points - currentStageThreshold;
                int pointsNeededForNextStage = nextStageThreshold - currentStageThreshold;
                int pointsRemainingForNextStage = nextStageThreshold - points;
                int progressPercentage = (pointsInCurrentStage * 100) / pointsNeededForNextStage;
                
                // Add streak information if available
                string streakInfo = "";
                if (user != null && user.StreakCount > 0)
                {
                    streakInfo = $"\n🔥 *Current Streak: {user.StreakCount} days*\n" +
                                $"Keep your streak going by being active daily!";
                }
                
                response = $"You have *{points} Bricks*! 🎉\n\n" +
                           $"{stageName}\n\n" +
                           $"{progressBar}\n" +
                           $"*{progressPercentage}%* complete - {pointsRemainingForNextStage} more Bricks needed for next stage\n" +
                           $"{streakInfo}\n\n" +
                           "*How to earn more Bricks:*\n" +
                           "• Refer friends: 150 Bricks per referral\n" +
                           "• Daily activity: Up to 20 Bricks per day\n" +
                           "• Maintain streaks: Bonus rewards for consistency";
            }

            Console.WriteLine($"[DEBUG] TELEGRAM REQUEST: Sending points response to user {userId} in chat {chatId}");
            await _botClient.SendTextMessageAsync(
                chatId: chatId,
                text: response,
                parseMode: ParseMode.Markdown,
                cancellationToken: cancellationToken
            );
            Console.WriteLine($"[DEBUG] TELEGRAM RESPONSE: Successfully sent points response to user {userId}");
        }

        /// <summary>
        /// Determines the user's stage and title based on their Bricks total
        /// </summary>
        /// <param name="points">The user's total Bricks</param>
        /// <returns>A string with the user's stage and title</returns>
        /// <summary>
        /// Gets the user's stage information based on their points
        /// </summary>
        /// <param name="points">User's points</param>
        /// <returns>Tuple containing stage name, stage number, and next stage threshold</returns>
        private (string StageName, int StageNumber, int NextStageThreshold) GetUserStageInfo(int points)
        {
            if (points < 500)
                return ("*Stage 1: Welcome Explorer* 🌱\nYou're taking your first steps in the community!", 1, 500);
            else if (points < 2000)
                return ("*Stage 2: Active Citizen* 🔥\nYou're building your foundation in the community!", 2, 2000);
            else if (points < 5000)
                return ("*Stage 3: Community Builder* 🛡️\nYou're now a trusted member with a special badge!", 3, 5000);
            else if (points < 10000)
                return ("*Stage 4: Contributor* 🧠\nYou're shaping the culture here!", 4, 10000);
            else if (points < 20000)
                return ("*Stage 5: Influencer* 📢\nYou're making waves. Keep going!", 5, 20000);
            else if (points < 35000)
                return ("*Stage 6: Partner* 🤝\nYou're now a Bricks ally!", 6, 35000);
            else if (points < 60000)
                return ("*Stage 7: Ambassador* 🏆\nYou've got real influence with a special badge!", 7, 60000);
            else if (points < 100000)
                return ("*Stage 8: Luminary* ✨\nYou're a beacon for others!", 8, 100000);
            else if (points < 250000)
                return ("*Stage 9: Legend* 🔥\nYou're a legacy-maker in the community!", 9, 250000);
            else
                return ("*Stage 10: Hall of Flame* 🪙\nYou're eternalized in Bricks history!", 10, int.MaxValue);
        }
        
        /// <summary>
        /// Gets the threshold for a specific stage
        /// </summary>
        private int GetStageThreshold(int stage)
        {
            switch (stage)
            {
                case 0: return 0;
                case 1: return 500;
                case 2: return 2000;
                case 3: return 5000;
                case 4: return 10000;
                case 5: return 20000;
                case 6: return 35000;
                case 7: return 60000;
                case 8: return 100000;
                case 9: return 250000;
                default: return 0;
            }
        }
        
        /// <summary>
        /// Generates a visual progress bar based on points and stage
        /// </summary>
        private string GenerateProgressBar(int points, int stage)
        {
            // For the last stage, show a full bar
            if (stage >= 10)
                return "▓▓▓▓▓▓▓▓▓▓ 100%";
                
            int currentStageThreshold = GetStageThreshold(stage - 1);
            int nextStageThreshold = GetStageThreshold(stage);
            
            // Calculate progress percentage within the current stage
            int pointsInCurrentStage = points - currentStageThreshold;
            int pointsNeededForNextStage = nextStageThreshold - currentStageThreshold;
            int progressPercentage = (pointsInCurrentStage * 100) / pointsNeededForNextStage;
            
            // Generate a 10-character progress bar
            int filledBlocks = (progressPercentage * 10) / 100;
            string progressBar = new string('▓', filledBlocks) + new string('░', 10 - filledBlocks);
            
            return progressBar;
        }
        
        /// <summary>
        /// Legacy method for backward compatibility
        /// </summary>
        private string GetUserStage(int points)
        {
            return GetUserStageInfo(points).StageName;
        }

        /// <summary>
        /// Handles the /getRefLink command
        /// </summary>
        public async Task HandleGetRefLinkCommandAsync(Message message, CancellationToken cancellationToken)
        {
            var userId = message.From?.Id.ToString();
            var chatId = message.Chat.Id;
            
            if (string.IsNullOrEmpty(userId))
                return;

            // Only allow in private chats
            if (message.Chat.Type != Telegram.Bot.Types.Enums.ChatType.Private)
            {
                await _botClient.SendTextMessageAsync(
                    chatId: chatId,
                    text: "Please use this command in a private chat with the bot.",
                    cancellationToken: cancellationToken
                );
                return;
            }

            Console.WriteLine($"[DEBUG] About to call GetReferralLinkAsync for user {userId}");
            string referralLink = await _referralService.GetReferralLinkAsync(userId);
            Console.WriteLine($"[DEBUG] Received referral link: {referralLink}");
            
            await _botClient.SendTextMessageAsync(
                chatId: chatId,
                text: $"Here's your referral link:\n{referralLink}\n\n" +
                      "Share this link with your friends. When they join our group, you'll earn 150 Bricks!",
                cancellationToken: cancellationToken
            );
            Console.WriteLine($"[DEBUG] Sent referral link to user");
        }

        public async Task HandleHelpCommandAsync(Message message, CancellationToken cancellationToken)
        {
            var chatId = message.Chat.Id;
            await SendHelpMessageAsync(chatId, cancellationToken);
        }
        
        /// <summary>
        /// Handles the /addbricks command to manually add Bricks to a user (admin only)
        /// </summary>
        public async Task HandleAddBricksCommandAsync(Message message, CancellationToken cancellationToken)
        {
            var userId = message.From?.Id.ToString();
            var chatId = message.Chat.Id;
            
            // Only allow admin to use this command
            if (userId != _adminUserId)
            {
                await _botClient.SendTextMessageAsync(
                    chatId: chatId,
                    text: "Sorry, this command is only available to administrators.",
                    cancellationToken: cancellationToken
                );
                return;
            }
            
            // Parse command: /addbricks userId amount
            var parts = message.Text.Split(' ');
            if (parts.Length != 3)
            {
                await _botClient.SendTextMessageAsync(
                    chatId: chatId,
                    text: "Usage: /addbricks [userId] [amount]",
                    cancellationToken: cancellationToken
                );
                return;
            }
            
            string targetUserId = parts[1];
            if (!int.TryParse(parts[2], out int amount))
            {
                await _botClient.SendTextMessageAsync(
                    chatId: chatId,
                    text: "Amount must be a number.",
                    cancellationToken: cancellationToken
                );
                return;
            }
            
            Console.WriteLine($"[DEBUG] Manually adding {amount} Bricks to user {targetUserId}");
            
            try
            {
                // Award points
                await _pointsService.AwardPointsAsync(targetUserId, amount, "admin award");
                
                // Get updated points
                int currentPoints = await _pointsService.GetPointsAsync(targetUserId);
                
                await _botClient.SendTextMessageAsync(
                    chatId: chatId,
                    text: $"Successfully added {amount} Bricks to user {targetUserId}. They now have {currentPoints} Bricks total.",
                    cancellationToken: cancellationToken
                );
            }
            catch (Exception ex)
            {
                await _botClient.SendTextMessageAsync(
                    chatId: chatId,
                    text: $"Error adding Bricks: {ex.Message}",
                    cancellationToken: cancellationToken
                );
            }
        }

        private async Task SendNewUserMessageAsync(long chatId, string firstName, CancellationToken cancellationToken)
        {
            string welcomeMessage = $"Hello {firstName} 👋\n\n" +
                                  "Welcome to iletesbot!\n\n" +
                                  "This bot helps you track referrals and earn Bricks.\n\n" +
                                  "• Earn your first Bricks by joining the group\n" +
                                  "• Get your referral link and share it with friends\n" +
                                  "• When they join using your link, you get Bricks\n" +
                                  "• Earn more Bricks when your referrals are active\n" +
                                  "• Compete for the top position on the leaderboard\n\n" +
                                  "Type /help to see all available commands!";

            await SendMessageWithButtons(chatId, welcomeMessage, cancellationToken);
        }

        private async Task SendNewUserWithReferralMessageAsync(long chatId, string firstName, CancellationToken cancellationToken)
        {
            string welcomeMessage = $"Hello {firstName} 👋\n\n" +
                                  "Welcome to iletesbot!\n\n" +
                                  "You've been invited to join our community. 🎉\n\n" +
                                  "• Join our group to get your first 30 Bricks\n" +
                                  "• Your friend will earn 150 Bricks when you join\n" +
                                  "• Get your own referral link to invite others\n" +
                                  "• Earn more Bricks when your referrals are active\n" +
                                  "• Compete for the top position on the leaderboard\n\n" +
                                  "Type /help to see all available commands!";

            await SendMessageWithReferralButtons(chatId, welcomeMessage, cancellationToken);
        }

        private async Task SendReturningUserMessageAsync(long chatId, string firstName, CancellationToken cancellationToken)
        {
            string welcomeMessage = $"Welcome back {firstName} 👋\n\n" +
                                  "Let's continue growing your Bricks!\n\n" +
                                  "• Share your referral link with friends\n" +
                                  "• Earn 150 Bricks for each friend who joins\n" +
                                  "• Check your current Bricks balance\n" +
                                  "• View your position on the leaderboard\n\n" +
                                  "Type /help to see all available commands!";

            await SendMessageWithButtons(chatId, welcomeMessage, cancellationToken);
        }

        private async Task SendMessageWithReferralButtons(long chatId, string message, CancellationToken cancellationToken)
        {
            // Get group link from environment variable
            string groupLink = Environment.GetEnvironmentVariable("LINK_GROUP") ?? "https://telegram.me/aisolae";
            
            // For first-time users who joined via referral link, show "Join Ilé Community" button
            // instead of Leaderboard and Journey Map
            var replyMarkup = ButtonHelper.CreateInlineKeyboard(new[]
            {
                new[] { ("👥 Join Ilé Community", groupLink) },
                new[] { ("🔗 Get Referral Link", "/getreflink"), ("💎 My Bricks", "/mypoints") }
            });

            await _botClient.SendTextMessageAsync(
                chatId: chatId,
                text: message,
                replyMarkup: replyMarkup,
                cancellationToken: cancellationToken
            );
        }

        private async Task SendMessageWithButtons(long chatId, string message, CancellationToken cancellationToken)
        {
            // Standard buttons for regular users
            var replyMarkup = ButtonHelper.CreateInlineKeyboard(new[]
            {
                new[] { ("🔗 Get Referral Link", "/getreflink"), ("💎 My Bricks", "/mypoints") },
                new[] { ("🏆 Leaderboard", "/leaderboard"), ("🗺️ Journey Map", "/journey") }
            });

            await _botClient.SendTextMessageAsync(
                chatId: chatId,
                text: message,
                replyMarkup: replyMarkup,
                cancellationToken: cancellationToken
            );
        }

        private async Task SendHelpMessageAsync(long chatId, CancellationToken cancellationToken)
        {
            string helpMessage = "Available commands:\n\n" +
                               "Group Commands:\n" +
                               "• /help - Show this help message\n\n" +
                               "Private Chat Commands:\n" +
                               "• /disableNotice - Turns off private bot notifications\n" +
                               "• /enableNotice - Turns on private bot notifications\n" +
                               "• /myID - Shows your Telegram user ID\n" +
                               "• /stats - Shows personal statistics including referrals and points\n\n" +
                               "Quick Actions Available Below 👇";

            var replyMarkup = ButtonHelper.CreateInlineKeyboard(new[]
            {
                new[] { ("🔗 Get Referral Link", "/getreflink"), ("💎 My Bricks", "/mypoints") },
                new[] { ("🏆 Leaderboard", "/leaderboard"), ("🗺️ Journey Map", "/journey") }
            });

            await _botClient.SendTextMessageAsync(
                chatId: chatId,
                text: helpMessage,
                replyMarkup: replyMarkup,
                cancellationToken: cancellationToken
            );
        }
    }
}
