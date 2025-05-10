using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Telegram.Bot;
using Telegram.Bot.Types;
using TelegramReferralBot.Services;
using TelegramReferralBot.Utils;

namespace TelegramReferralBot.Handlers
{
    public class PrivateHandler
    {
        private readonly TelegramService _telegramService;
        private readonly ActivityService _activityService;
        private readonly ILogger<PrivateHandler> _logger;

        public PrivateHandler(
            TelegramService telegramService,
            ActivityService activityService,
            ILogger<PrivateHandler> logger)
        {
            _telegramService = telegramService;
            _activityService = activityService;
            _logger = logger;
        }

        public async Task HandlePrivateMessageAsync(Message message, CancellationToken cancellationToken)
        {
            try
            {
                if (message.Text == null)
                    return;

                var userId = message.From?.Id.ToString();
                if (string.IsNullOrEmpty(userId))
                    return;

                // Log private message activity
                await _activityService.LogActivityAsync(userId, Constants.ActivityType.Message);

                // Handle private message commands
                switch (message.Text.ToLower())
                {
                    case "/start":
                        await HandleStartCommandAsync(message, cancellationToken);
                        break;
                    case "/help":
                        await HandleHelpCommandAsync(message, cancellationToken);
                        break;
                    default:
                        await HandleUnknownCommandAsync(message, cancellationToken);
                        break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error handling private message: {ex.Message}");
                throw;
            }
        }

        private async Task HandleStartCommandAsync(Message message, CancellationToken cancellationToken)
        {
            var welcomeMessage = "Welcome to the Ile Referral Bot! 🎉\n\n" +
                               "Here's what you can do:\n" +
                               "• /mypoints - Check your points balance\n" +
                               "• /getreflink - Get your referral link\n" +
                               "• /leaderboard - View the points leaderboard\n" +
                               "• /journey - View your points journey map\n" +
                               "• /help - Show this help message";

            await _telegramService.SendMessageAsync(message.Chat.Id, welcomeMessage, cancellationToken);
        }

        private async Task HandleHelpCommandAsync(Message message, CancellationToken cancellationToken)
        {
            var helpMessage = "Here are all available commands:\n\n" +
                            "• /mypoints - Check your points balance\n" +
                            "• /getreflink - Get your referral link\n" +
                            "• /leaderboard - View the points leaderboard\n" +
                            "• /journey - View your points journey map\n" +
                            "• /help - Show this help message";

            await _telegramService.SendMessageAsync(message.Chat.Id, helpMessage, cancellationToken);
        }

        private async Task HandleUnknownCommandAsync(Message message, CancellationToken cancellationToken)
        {
            var unknownCommandMessage = "Sorry, I don't understand that command. Use /help to see available commands.";
            await _telegramService.SendMessageAsync(message.Chat.Id, unknownCommandMessage, cancellationToken);
        }
    }
}
