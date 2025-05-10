using System;
using System.Threading;
using System.Threading.Tasks;
using Telegram.Bot;
using Telegram.Bot.Types;
using TelegramReferralBot.Services;
using TelegramReferralBot.Utils;

namespace TelegramReferralBot.Handlers
{
    public class CallbackHandler
    {
        private readonly ITelegramBotClient _botClient;
        private readonly CommandHandler _commandHandler;
        private readonly LeaderboardHandler _leaderboardHandler;
        private readonly AdminHandler _adminHandler;
        private readonly IBotLogger _logger;

        public CallbackHandler(
            ITelegramBotClient botClient,
            CommandHandler commandHandler,
            LeaderboardHandler leaderboardHandler,
            AdminHandler adminHandler,
            ILogger logger)
        {
            _botClient = botClient;
            _commandHandler = commandHandler;
            _leaderboardHandler = leaderboardHandler;
            _adminHandler = adminHandler;
            _logger = new LoggerAdapter(logger);
        }

        /// <summary>
        /// Processes callback queries from inline keyboards
        /// </summary>
        public async Task HandleCallbackQueryAsync(CallbackQuery callbackQuery, CancellationToken cancellationToken)
        {
            try
            {
                string userId = callbackQuery.From.Id.ToString();
                string action = callbackQuery.Data;
                var message = callbackQuery.Message;
                string buttonText = "Unknown"; // Try to determine the button text if possible
                
                // If we have the message, try to find the button text that was clicked
                if (message?.ReplyMarkup?.InlineKeyboard != null)
                {
                    foreach (var row in message.ReplyMarkup.InlineKeyboard)
                    {
                        foreach (var button in row)
                        {
                            if (button.CallbackData == action)
                            {
                                buttonText = button.Text;
                                break;
                            }
                        }
                    }
                }
                
                Console.WriteLine($"[DEBUG] Button clicked by user {userId}: '{buttonText}' with callback data: {action}");
                _logger.Log($"Button clicked by user {userId}: '{buttonText}' with callback data: {action}");
                
                // Use the ButtonHelper to log the click
                ButtonHelper.LogButtonClick(userId, buttonText, action);

                // Remove leading slash if present
                action = action.TrimStart('/');
                Console.WriteLine($"[DEBUG] Processing callback action: {action}");

                // Handle admin callbacks first
                if (action.StartsWith("admin_"))
                {
                    Console.WriteLine($"[DEBUG] Admin callback detected: {action} from user {userId}");
                    await _adminHandler.HandleAdminCallbackAsync(callbackQuery, cancellationToken);
                    return;
                }

                switch (action)
                {
                    case "mypoints":
                        Console.WriteLine($"[DEBUG] User {userId} requested to view their points");
                        
                        // Create a new message with the correct From property to ensure the right user ID is used
                        var myPointsMessage = new Message
                        {
                            From = callbackQuery.From,  // Use the From from the callback query (the actual user)
                            Chat = message.Chat,
                            MessageId = message.MessageId
                        };
                        
                        Console.WriteLine($"[DEBUG] Created new message with From.Id = {myPointsMessage.From.Id} for mypoints command");
                        await _commandHandler.HandleMyPointsCommandAsync(myPointsMessage, cancellationToken);
                        break;

                    case "getreflink":
                        Console.WriteLine($"[DEBUG] User {userId} requested to get their referral link");
                        // Create a new message with the correct From property
                        var newMessage = new Message
                        {
                            From = callbackQuery.From,  // Use the From from the callback query (the actual user)
                            Chat = message.Chat,
                            MessageId = message.MessageId
                        };
                        await _commandHandler.HandleGetRefLinkCommandAsync(newMessage, cancellationToken);
                        break;

                    case "leaderboard":
                        Console.WriteLine($"[DEBUG] User {userId} requested to view the leaderboard");
                        await _leaderboardHandler.SendLeaderboardAsync(message, cancellationToken);
                        break;

                    case "journey":
                        Console.WriteLine($"[DEBUG] User {userId} requested to view the bricks journey map");
                        await _leaderboardHandler.SendBricksJourneyMapAsync(message, cancellationToken);
                        break;
                        
                    default:
                        Console.WriteLine($"[DEBUG] Unknown callback action: {action} from user {userId}");
                        break;
                }

                // Answer callback query to remove loading state
                Console.WriteLine($"[DEBUG] Answering callback query {callbackQuery.Id} for user {userId}");
                await _botClient.AnswerCallbackQueryAsync(
                    callbackQueryId: callbackQuery.Id,
                    cancellationToken: cancellationToken
                );
                Console.WriteLine($"[DEBUG] Successfully answered callback query for user {userId}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] Error handling callback: {ex.Message}");
                _logger.Log($"Error handling callback: {ex.Message}");
            }
        }
    }
}
