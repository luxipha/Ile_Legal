using System;
using System.IO;
using Microsoft.Extensions.Logging;

namespace TelegramReferralBot.Utils
{
    public static class Logging
    {
        private static ILogger _logger;
        private static string _logFilePath;
        private static readonly object _lockObject = new object();

        public static void Initialize(ILogger logger, string logFilePath)
        {
            _logger = logger;
            _logFilePath = logFilePath;
            
            // Ensure log directory exists
            var logDir = Path.GetDirectoryName(_logFilePath);
            if (!string.IsNullOrEmpty(logDir) && !Directory.Exists(logDir))
            {
                Directory.CreateDirectory(logDir);
            }
        }

        public static void LogInformation(string message)
        {
            Log(LogLevel.Information, message);
        }

        public static void LogWarning(string message)
        {
            Log(LogLevel.Warning, message);
        }

        public static void LogError(string message, Exception ex = null)
        {
            Log(LogLevel.Error, message, ex);
        }

        public static void LogDebug(string message)
        {
            Log(LogLevel.Debug, message);
        }

        private static void Log(LogLevel level, string message, Exception? ex = null)
        {
            var timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss.fff");
            var logMessage = $"[{timestamp}] [{level}] {message}";
            
            if (ex != null)
            {
                logMessage += $"\nException: {ex.Message}\nStackTrace: {ex.StackTrace}";
            }

            // Log to ILogger if available
            if (_logger != null)
            {
                _logger.Log(level, new EventId(0), logMessage, ex, (state, error) => state.ToString()!);
            }

            // Also log to file
            if (!string.IsNullOrEmpty(_logFilePath))
            {
                lock (_lockObject)
                {
                    try
                    {
                        File.AppendAllText(_logFilePath, logMessage + Environment.NewLine);
                    }
                    catch (Exception)
                    {
                        // If file logging fails, at least try to write to console
                        Console.WriteLine($"Failed to write to log file: {logMessage}");
                    }
                }
            }

            // Always write to console for development visibility
            Console.WriteLine(logMessage);
        }
    }
}
