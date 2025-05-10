using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Telegram.Bot;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;
using TelegramReferralBot.Handlers;
using TelegramReferralBot.Services;
using TelegramReferralBot.Utils;

namespace TelegramReferralBot
{
    /// <summary>
    /// Main message processor that routes messages to appropriate handlers
    /// </summary>
    public class MessageProcessor
    {
        private readonly ITelegramBotClient _botClient;
        private readonly CommandHandler _commandHandler;
        private readonly GroupHandler _groupHandler;
        private readonly LeaderboardHandler _leaderboardHandler;
        private readonly AdminHandler _adminHandler;
        private readonly CallbackHandler _callbackHandler;
        private readonly IBotLogger _logger;

        public MessageProcessor(
            ITelegramBotClient botClient,
            MongoDbService mongoDb,
            ILoggerFactory loggerFactory)
        {
            _botClient = botClient;
            _logger = new LoggerAdapter(loggerFactory.CreateLogger<MessageProcessor>());

            // Initialize services
            var pointsService = new PointsService(botClient, mongoDb, loggerFactory.CreateLogger<PointsService>());
            var activityService = new ActivityService(mongoDb, loggerFactory.CreateLogger<ActivityService>());
            var referralService = new ReferralService(botClient, mongoDb, activityService, pointsService, loggerFactory.CreateLogger<ReferralService>());

            // Initialize handlers
            _commandHandler = new CommandHandler(botClient, referralService, pointsService, mongoDb, loggerFactory.CreateLogger<CommandHandler>());
            _groupHandler = new GroupHandler(botClient, mongoDb, pointsService, referralService, loggerFactory.CreateLogger<GroupHandler>());
            _leaderboardHandler = new LeaderboardHandler(botClient, mongoDb, loggerFactory.CreateLogger<LeaderboardHandler>());
            _adminHandler = new AdminHandler(botClient, mongoDb, loggerFactory.CreateLogger<AdminHandler>());
            _callbackHandler = new CallbackHandler(botClient, _commandHandler, _leaderboardHandler, _adminHandler, loggerFactory.CreateLogger<CallbackHandler>());
        }

        /// <summary>
        /// Main entry point for processing messages
        /// </summary>
        public async Task ProcessMessageAsync(Message message, CancellationToken cancellationToken)
        {
            try
            {
                if (message.Type != MessageType.Text)
                    return;

                string messageText = message.Text;
                if (string.IsNullOrEmpty(messageText))
                    return;

                // Handle commands
                if (messageText.StartsWith("/"))
                {
                    await ProcessCommandAsync(message, cancellationToken);
                    return;
                }

                // Handle group messages
                if (message.Chat.Type == ChatType.Group || message.Chat.Type == ChatType.Supergroup)
                {
                    Console.WriteLine($"[DEBUG] GROUP DETECTED: ID={message.Chat.Id}, Title={message.Chat.Title}, Type={message.Chat.Type}");
                    Console.WriteLine($"[DEBUG] GROUP MESSAGE: From={message.From.Id} ({message.From.Username ?? message.From.FirstName}), MessageId={message.MessageId}");
                    Console.WriteLine($"[DEBUG] GROUP MESSAGE CONTENT: {message.Text ?? "[No text content]"}");
                    
                    // Log if this is a new member message
                    if (message.NewChatMembers != null && message.NewChatMembers.Length > 0)
                    {
                        Console.WriteLine($"[DEBUG] GROUP NEW MEMBERS: Count={message.NewChatMembers.Length}");
                        foreach (var member in message.NewChatMembers)
                        {
                            Console.WriteLine($"[DEBUG] GROUP NEW MEMBER: ID={member.Id}, Username={member.Username ?? "Unknown"}, IsBot={member.IsBot}");
                        }
                    }
                    
                    await _groupHandler.HandleGroupMessageAsync(message, cancellationToken);
                    return;
                }

                // Handle private messages
                if (message.Chat.Type == ChatType.Private)
                {
                    await HandlePrivateMessageAsync(message, cancellationToken);
                }
            }
            catch (Exception ex)
            {
                _logger.Log($"Error processing message: {ex.Message}");
            }
        }

        /// <summary>
        /// Processes callback queries from inline keyboards
        /// </summary>
        public async Task ProcessCallbackQueryAsync(CallbackQuery callbackQuery, CancellationToken cancellationToken)
        {
            await _callbackHandler.HandleCallbackQueryAsync(callbackQuery, cancellationToken);
        }

        private async Task ProcessCommandAsync(Message message, CancellationToken cancellationToken)
        {
            string command = message.Text.Split(' ')[0].ToLower();
            
            switch (command)
            {
                case "/start":
                    await _commandHandler.HandleStartCommandAsync(message, cancellationToken);
                    break;

                case "/help":
                    await _commandHandler.HandleHelpCommandAsync(message, cancellationToken);
                    break;

                case "/mypoints":
                case "/points":
                    await _commandHandler.HandleMyPointsCommandAsync(message, cancellationToken);
                    break;

                case "/getreflink":
                    await _commandHandler.HandleGetRefLinkCommandAsync(message, cancellationToken);
                    break;

                case "/leaderboard":
                    await _leaderboardHandler.SendLeaderboardAsync(message, cancellationToken);
                    break;

                case "/journey":
                    await _leaderboardHandler.SendBricksJourneyMapAsync(message, cancellationToken);
                    break;

                case "/listall":
                    await _adminHandler.ListAllMembersAsync(message, cancellationToken);
                    break;

                case "/myid":
                    await HandleMyIdCommandAsync(message, cancellationToken);
                    break;

                case "/disablenotice":
                    await HandleDisableNoticeCommandAsync(message, cancellationToken);
                    break;

                case "/enablenotice":
                    await HandleEnableNoticeCommandAsync(message, cancellationToken);
                    break;

                case "/stats":
                    await HandleStatsCommandAsync(message, cancellationToken);
                    break;

                case "/admin":
                    await _adminHandler.HandleAdminCommandAsync(message, cancellationToken);
                    break;

                case "/ban":
                    await _adminHandler.BanUserAsync(message, cancellationToken);
                    break;

                case "/findmemberid":
                    await _adminHandler.HandleFindMemberIDCommandAsync(message, cancellationToken);
                    break;
                    
                case "/adminmenu":
                    await _adminHandler.HandleAdminMenuCommandAsync(message, cancellationToken);
                    break;

                case "/edituser":
                    await _adminHandler.HandleEditUserCommandAsync(message, cancellationToken);
                    break;

                case "/referrals":
                    await _leaderboardHandler.ListReferralsAsync(message, cancellationToken);
                    break;
            }
        }

        private async Task HandlePrivateMessageAsync(Message message, CancellationToken cancellationToken)
        {
            // For non-command messages in private, show the help message
            await _commandHandler.HandleHelpCommandAsync(message, cancellationToken);
        }

        /// <summary>
        /// Handles the /myid command
        /// </summary>
        private async Task HandleMyIdCommandAsync(Message message, CancellationToken cancellationToken)
        {
            var userId = message.From?.Id.ToString();
            var chatId = message.Chat.Id;
            
            if (string.IsNullOrEmpty(userId))
                return;

            await _botClient.SendTextMessageAsync(
                chatId: chatId,
                text: $"Your Telegram ID is: {userId}",
                cancellationToken: cancellationToken
            );
        }

        /// <summary>
        /// Handles the /disablenotice command
        /// </summary>
        private async Task HandleDisableNoticeCommandAsync(Message message, CancellationToken cancellationToken)
        {
            var userId = message.From?.Id.ToString();
            var chatId = message.Chat.Id;
            
            if (string.IsNullOrEmpty(userId))
                return;

            // Update user preference in MongoDB
            await Program.MongoDb.UpdateShowWelcomeAsync(userId, false);
            
            await _botClient.SendTextMessageAsync(
                chatId: chatId,
                text: "You have disabled bot notifications. You can enable them again with /enablenotice.",
                cancellationToken: cancellationToken
            );
        }

        /// <summary>
        /// Handles the /enablenotice command
        /// </summary>
        private async Task HandleEnableNoticeCommandAsync(Message message, CancellationToken cancellationToken)
        {
            var userId = message.From?.Id.ToString();
            var chatId = message.Chat.Id;
            
            if (string.IsNullOrEmpty(userId))
                return;

            // Update user preference in MongoDB
            await Program.MongoDb.UpdateShowWelcomeAsync(userId, true);
            
            await _botClient.SendTextMessageAsync(
                chatId: chatId,
                text: "You have enabled bot notifications. You can disable them again with /disablenotice.",
                cancellationToken: cancellationToken
            );
        }

        /// <summary>
        /// Handles the /stats command
        /// </summary>
        private async Task HandleStatsCommandAsync(Message message, CancellationToken cancellationToken)
        {
            var userId = message.From?.Id.ToString();
            var chatId = message.Chat.Id;
            
            if (string.IsNullOrEmpty(userId))
                return;

            try {
                // Get user data
                var user = await Program.MongoDb.GetUserAsync(userId);
                if (user == null)
                {
                    await _botClient.SendTextMessageAsync(
                        chatId: chatId,
                        text: "You don't have any stats yet. Start by inviting friends with your referral link!",
                        cancellationToken: cancellationToken
                    );
                    return;
                }

                // Get referral count
                int referralCount = user.Referrals?.Count ?? 0;
                
                // Get user's current points
                int points = user.BricksTotal;
                
                // Get user's rank
                var topUsers = await Program.MongoDb.GetTopUsersByPointsAsync(100);
                int rank = 0;
                for (int i = 0; i < topUsers.Count; i++)
                {
                    if (topUsers[i].TelegramId == userId)
                    {
                        rank = i + 1;
                        break;
                    }
                }

                // Build stats message
                var statsMessage = $"📊 *Your Stats* 📊\n\n" +
                                 $"Total Referrals: {referralCount}\n" +
                                 $"Total Bricks: {points}\n" +
                                 $"Current Rank: {(rank > 0 ? $"#{rank}" : "Not ranked yet")}\n\n" +
                                 $"Keep inviting friends to earn more Bricks!";

                await _botClient.SendTextMessageAsync(
                    chatId: chatId,
                    text: statsMessage,
                    parseMode: Telegram.Bot.Types.Enums.ParseMode.Markdown,
                    cancellationToken: cancellationToken
                );
            }
            catch (Exception ex)
            {
                _logger.Log($"Error getting user stats: {ex.Message}");
                await _botClient.SendTextMessageAsync(
                    chatId: chatId,
                    text: "Sorry, there was an error retrieving your stats. Please try again later.",
                    cancellationToken: cancellationToken
                );
            }
        }
    }
}
