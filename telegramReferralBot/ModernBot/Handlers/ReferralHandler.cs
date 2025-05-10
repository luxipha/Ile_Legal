using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Telegram.Bot.Types;
using TelegramReferralBot.Services;
using TelegramReferralBot.Utils;

namespace TelegramReferralBot.Handlers
{
    public class ReferralHandler
    {
        private readonly TelegramService _telegramService;
        private readonly ActivityService _activityService;
        private readonly ReferralService _referralService;
        private readonly ILogger<ReferralHandler> _logger;

        public ReferralHandler(
            TelegramService telegramService,
            ActivityService activityService,
            ReferralService referralService,
            ILogger<ReferralHandler> logger)
        {
            _telegramService = telegramService;
            _activityService = activityService;
            _referralService = referralService;
            _logger = logger;
        }

        public async Task HandleReferralLinkAsync(Message message, CancellationToken cancellationToken)
        {
            try
            {
                var userId = message.From?.Id.ToString();
                if (string.IsNullOrEmpty(userId))
                    return;

                var referralLink = await _referralService.GetReferralLinkAsync(userId);
                var response = $"Here's your referral link: {referralLink}\n\n" +
                             "Share this link with your friends. When they join the group using your link, " +
                             $"you'll earn {Constants.Points.ReferralReward} Bricks!";

                await _telegramService.SendMessageAsync(message.Chat.Id, response, cancellationToken);
                await _activityService.LogActivityAsync(userId, "generate_reflink");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error handling referral link request: {ex.Message}");
                throw;
            }
        }

        public async Task HandleReferralClickAsync(string referralCode, long userId, CancellationToken cancellationToken)
        {
            try
            {
                await _referralService.HandleReferralClickAsync(userId.ToString(), referralCode);
                var message = "Welcome! You've been referred by another member. " +
                            $"Join the group to earn {Constants.Points.JoinReward} Bricks!";
                await _telegramService.SendMessageAsync(userId, message, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error handling referral click: {ex.Message}");
                throw;
            }
        }
    }
}
