using System;

namespace TelegramReferralBot.Utils
{
    public class FileLogger : IBotLogger
    {
        public void Log(string message)
        {
            string logMessage = $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] {message}";
            // Log to file
            File.AppendAllText(Config.LogFilePath, $"{logMessage}\n");
        }
    }
}
