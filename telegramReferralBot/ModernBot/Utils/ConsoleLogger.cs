using System;

namespace TelegramReferralBot.Utils
{
    public class ConsoleLogger : IBotLogger
    {
        public void Log(string message)
        {
            string timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss");
            Console.WriteLine($"[{timestamp}] {message}");
        }
    }
}
