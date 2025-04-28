namespace TelegramReferralBot;

/// <summary>
/// Handles logging functionality for the Telegram Referral Bot
/// </summary>
public static class Logging
{
    private static readonly object _lockObject = new();
    
    /// <summary>
    /// Adds a message to the log file
    /// </summary>
    /// <param name="message">Message to log</param>
    public static void AddToLog(string message)
    {
        try
        {
            lock (_lockObject)
            {
                string logFolder = Path.Combine(Config.OutputFilePath, "Logs");
                
                // Create logs directory if it doesn't exist
                if (!Directory.Exists(logFolder))
                {
                    Directory.CreateDirectory(logFolder);
                    Console.WriteLine("Created new directory Logs");
                }
                
                // Create log file path with current date
                string date = DateTime.Now.ToString("yyyyMMdd");
                string logFile = Path.Combine(logFolder, $"Log-{date}.txt");
                
                // Add timestamp to message
                string timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
                string logEntry = $"[{timestamp}] {message}";
                
                // Append message to log file
                using StreamWriter writer = File.AppendText(logFile);
                writer.WriteLine(logEntry);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error writing to log: {ex.Message}");
        }
    }
}
