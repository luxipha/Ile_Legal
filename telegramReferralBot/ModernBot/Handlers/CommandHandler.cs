using System;
using System.Threading;
using System.Threading.Tasks;
using Telegram.Bot;
using Telegram.Bot.Types;
using TelegramReferralBot.Services;
using TelegramReferralBot.Utils;

namespace TelegramReferralBot.Handlers
{
    public class CommandHandler
    {
        private readonly ITelegramBotClient _botClient;
        private readonly ReferralService _referralService;
        private readonly PointsService _pointsService;
        private readonly ILogger<CommandHandler> _logger;
        private readonly string _adminUserId = "5962815632"; // Abisoye's Telegram ID

        public CommandHandler(
            ITelegramBotClient botClient,
            ReferralService referralService,
            PointsService pointsService,
            ILogger<CommandHandler> logger)
        {
            _botClient = botClient;
            _referralService = referralService;
            _pointsService = pointsService;
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
            
            // Get user's points
            Console.WriteLine($"[DEBUG] COMMAND: Getting points for user {userId}");
            int points = await _pointsService.GetPointsAsync(userId);
            Console.WriteLine($"[DEBUG] COMMAND: User {userId} has {points} Bricks");
            
            string response;

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
                Console.WriteLine($"[DEBUG] COMMAND: User {userId} has {points} Bricks, sending bricks message");
                response = $"You have {points} Bricks! 🎉\n\n" +
                           "Keep earning more by referring friends to the group!";
            }

            Console.WriteLine($"[DEBUG] TELEGRAM REQUEST: Sending points response to user {userId} in chat {chatId}");
            await _botClient.SendTextMessageAsync(
                chatId: chatId,
                text: response,
                cancellationToken: cancellationToken
            );
            Console.WriteLine($"[DEBUG] TELEGRAM RESPONSE: Successfully sent points response to user {userId}");
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
                               "• /stats - Shows personal statistics including referrals and points\n" +
                               "• /listAll - List all members with Bricks\n\n" +
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
