using Microsoft.Extensions.Logging;

namespace TelegramReferralBot.Utils
{
    public class LoggerAdapter : IBotLogger
    {
        private readonly ILogger _logger;

        public LoggerAdapter(ILogger logger)
        {
            _logger = logger;
        }

        public void Log(string message)
        {
            _logger.LogInformation(message);
        }
    }
}
