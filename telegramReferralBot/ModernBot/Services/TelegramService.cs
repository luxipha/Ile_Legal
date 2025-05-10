using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Telegram.Bot;
using Telegram.Bot.Types;
using TelegramReferralBot.Utils;

namespace TelegramReferralBot.Services
{
    public class TelegramService
    {
        private readonly ITelegramBotClient _botClient;
        private readonly ILogger<TelegramService> _logger;

        public TelegramService(ITelegramBotClient botClient, ILogger<TelegramService> logger)
        {
            _botClient = botClient;
            _logger = logger;
        }

        public async Task<Message> SendMessageAsync(ChatId chatId, string text, CancellationToken cancellationToken = default)
        {
            try
            {
                return await _botClient.SendTextMessageAsync(
                    chatId: chatId,
                    text: text,
                    cancellationToken: cancellationToken
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending message to {chatId}: {ex.Message}");
                throw;
            }
        }

        public async Task<Chat> GetChatAsync(ChatId chatId, CancellationToken cancellationToken = default)
        {
            try
            {
                return await _botClient.GetChatAsync(chatId, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting chat {chatId}: {ex.Message}");
                throw;
            }
        }

        public async Task<ChatMember> GetChatMemberAsync(ChatId chatId, long userId, CancellationToken cancellationToken = default)
        {
            try
            {
                return await _botClient.GetChatMemberAsync(chatId, userId, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting chat member {userId} from chat {chatId}: {ex.Message}");
                throw;
            }
        }
    }
}
