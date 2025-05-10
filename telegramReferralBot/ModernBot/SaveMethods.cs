using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using TelegramReferralBot.Utils;

namespace TelegramReferralBot;

/// <summary>
/// Handles saving data to persistent storage for the Telegram Referral Bot
/// </summary>
public static class SaveMethods
{
    private static readonly object _lockObject = new();

    /// <summary>
    /// Saves user activity data to file or MongoDB
    /// </summary>
    /// <returns>True if successful, false otherwise</returns>
    public static bool SaveUserActivity()
    {
        // Try to save to MongoDB first
        if (State.MongoDb != null)
        {
            try
            {
                // Call the async method synchronously
                Task.Run(async () => await MongoDbSaveMethods.SaveUserActivityAsync()).Wait();
                return true;
            }
            catch (Exception ex)
            {
                string text = $"Error saving user activity to MongoDB: {ex.Message}. Falling back to file storage.";
                Logging.AddToLog(text);
                Console.WriteLine(text);
                // Fall back to file storage
            }
        }
        
        // Fall back to file storage
        try
        {
            lock (_lockObject)
            {
                string file = Path.Combine(Config.OutputFilePath, "userActivityData.518");
                string backupFile = file + "_old";

                // Backup existing file if it exists
                if (File.Exists(file))
                {
                    if (File.Exists(backupFile))
                    {
                        File.Delete(backupFile);
                    }
                    File.Move(file, backupFile);
                }

                // Create new file with updated data
                using StreamWriter writer = new(file);
                foreach (var entry in State.UserActivity)
                {
                    string data = entry.Key;
                    foreach (var line in entry.Value)
                    {
                        data += "?" + line.Key + "&" + line.Value.ToString();
                    }
                    writer.WriteLine(data);
                }
            }
            return true;
        }
        catch (Exception ex)
        {
            string text = $"Error saving userActivityData to file: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
            return false;
        }
    }

    /// <summary>
    /// Saves referral links data to file or MongoDB
    /// </summary>
    /// <returns>True if successful, false otherwise</returns>
    public static bool SaveRefLinks()
    {
        // Try to save to MongoDB first
        if (State.MongoDb != null)
        {
            try
            {
                // Call the async method synchronously
                Task.Run(async () => await MongoDbSaveMethods.SaveRefLinksAsync()).Wait();
                return true;
            }
            catch (Exception ex)
            {
                string text = $"Error saving ref links to MongoDB: {ex.Message}. Falling back to file storage.";
                Logging.AddToLog(text);
                Console.WriteLine(text);
                // Fall back to file storage
            }
        }
        
        // Fall back to file storage
        try
        {
            lock (_lockObject)
            {
                string file = Path.Combine(Config.OutputFilePath, "refLinksData.518");
                string backupFile = file + "_old";

                // Backup existing file if it exists
                if (File.Exists(file))
                {
                    if (File.Exists(backupFile))
                    {
                        File.Delete(backupFile);
                    }
                    File.Move(file, backupFile);
                }

                // Create new file with updated data
                using StreamWriter writer = new(file);
                foreach (var entry in State.RefLinks)
                {
                    writer.WriteLine(entry.Key + "?" + entry.Value);
                }
            }
            return true;
        }
        catch (Exception ex)
        {
            string text = $"Error saving refLinksData to file: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
            return false;
        }
    }

    /// <summary>
    /// Saves password attempts data to file or MongoDB
    /// </summary>
    /// <returns>True if successful, false otherwise</returns>
    public static bool SavePasswordAttempts()
    {
        // Try to save to MongoDB first
        if (State.MongoDb != null)
        {
            try
            {
                // Call the async method synchronously
                Task.Run(async () => await MongoDbSaveMethods.SavePasswordAttemptsAsync()).Wait();
                return true;
            }
            catch (Exception ex)
            {
                string text = $"Error saving password attempts to MongoDB: {ex.Message}. Falling back to file storage.";
                Logging.AddToLog(text);
                Console.WriteLine(text);
                // Fall back to file storage
            }
        }
        
        // Fall back to file storage
        try
        {
            lock (_lockObject)
            {
                string file = Path.Combine(Config.OutputFilePath, "passwordAttemptsData.518");
                string backupFile = file + "_old";

                // Backup existing file if it exists
                if (File.Exists(file))
                {
                    if (File.Exists(backupFile))
                    {
                        File.Delete(backupFile);
                    }
                    File.Move(file, backupFile);
                }

                // Create new file with updated data
                using StreamWriter writer = new(file);
                foreach (var entry in State.PasswordAttempts)
                {
                    writer.WriteLine(entry.Key + "?" + entry.Value.ToString());
                }
            }
            return true;
        }
        catch (Exception ex)
        {
            string text = $"Error saving passwordAttemptsData to file: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
            return false;
        }
    }

    /// <summary>
    /// Saves show welcome data to file or MongoDB
    /// </summary>
    /// <returns>True if successful, false otherwise</returns>
    public static bool SaveShowWelcome()
    {
        // Try to save to MongoDB first
        if (State.MongoDb != null)
        {
            try
            {
                // Call the async method synchronously
                Task.Run(async () => await MongoDbSaveMethods.SaveShowWelcomeAsync()).Wait();
                return true;
            }
            catch (Exception ex)
            {
                string text = $"Error saving show welcome to MongoDB: {ex.Message}. Falling back to file storage.";
                Logging.AddToLog(text);
                Console.WriteLine(text);
                // Fall back to file storage
            }
        }
        
        // Fall back to file storage
        try
        {
            lock (_lockObject)
            {
                string file = Path.Combine(Config.OutputFilePath, "showWelcomeData.518");
                string backupFile = file + "_old";

                // Backup existing file if it exists
                if (File.Exists(file))
                {
                    if (File.Exists(backupFile))
                    {
                        File.Delete(backupFile);
                    }
                    File.Move(file, backupFile);
                }

                // Create new file with updated data
                using StreamWriter writer = new(file);
                foreach (var entry in State.ShowWelcome)
                {
                    writer.WriteLine(entry.Key + "?" + entry.Value.ToString());
                }
            }
            return true;
        }
        catch (Exception ex)
        {
            string text = $"Error saving showWelcomeData to file: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
            return false;
        }
    }

    /// <summary>
    /// Saves referred by data to file or MongoDB
    /// </summary>
    /// <returns>True if successful, false otherwise</returns>
    public static bool SaveReferredBy()
    {
        // Try to save to MongoDB first
        if (State.MongoDb != null)
        {
            try
            {
                // Call the async method synchronously
                Task.Run(async () => await MongoDbSaveMethods.SaveReferredByAsync()).Wait();
                return true;
            }
            catch (Exception ex)
            {
                string text = $"Error saving referred by to MongoDB: {ex.Message}. Falling back to file storage.";
                Logging.AddToLog(text);
                Console.WriteLine(text);
                // Fall back to file storage
            }
        }
        
        // Fall back to file storage
        try
        {
            lock (_lockObject)
            {
                string file = Path.Combine(Config.OutputFilePath, "referredByData.518");
                string backupFile = file + "_old";

                // Backup existing file if it exists
                if (File.Exists(file))
                {
                    if (File.Exists(backupFile))
                    {
                        File.Delete(backupFile);
                    }
                    File.Move(file, backupFile);
                }

                // Create new file with updated data
                using StreamWriter writer = new(file);
                foreach (var entry in State.ReferredBy)
                {
                    writer.WriteLine(entry.Key + "?" + entry.Value);
                }
            }
            return true;
        }
        catch (Exception ex)
        {
            string text = $"Error saving referredByData to file: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
            return false;
        }
    }

    /// <summary>
    /// Saves group chat ID number to file or MongoDB
    /// </summary>
    /// <returns>True if successful, false otherwise</returns>
    public static bool SaveGroupChatIdNumber()
    {
        // Try to save to MongoDB first
        if (State.MongoDb != null)
        {
            try
            {
                // Call the async method synchronously
                Task.Run(async () => await MongoDbSaveMethods.SaveGroupChatIdNumberAsync()).Wait();
                return true;
            }
            catch (Exception ex)
            {
                string text = $"Error saving group chat ID number to MongoDB: {ex.Message}. Falling back to file storage.";
                Logging.AddToLog(text);
                Console.WriteLine(text);
                // Fall back to file storage
            }
        }
        
        // Fall back to file storage
        try
        {
            lock (_lockObject)
            {
                string file = Path.Combine(Config.OutputFilePath, "groupIDnumber.518");
                string backupFile = file + "_old";

                // Backup existing file if it exists
                if (File.Exists(file))
                {
                    if (File.Exists(backupFile))
                    {
                        File.Delete(backupFile);
                    }
                    File.Move(file, backupFile);
                }

                // Create new file with updated data
                using StreamWriter writer = new(file);
                writer.WriteLine(Config.GroupChatIdNumber.ToString());
            }
            return true;
        }
        catch (Exception ex)
        {
            string text = $"Error saving groupIDnumber to file: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
            return false;
        }
    }

    /// <summary>
    /// Saves points by referrer data to file or MongoDB
    /// </summary>
    /// <returns>True if successful, false otherwise</returns>
    public static bool SavePointsByReferrer()
    {
        // Try to save to MongoDB first
        if (State.MongoDb != null)
        {
            try
            {
                // Call the async method synchronously
                Task.Run(async () => await MongoDbSaveMethods.SavePointsByReferrerAsync()).Wait();
                return true;
            }
            catch (Exception ex)
            {
                string text = $"Error saving points by referrer to MongoDB: {ex.Message}. Falling back to file storage.";
                Logging.AddToLog(text);
                Console.WriteLine(text);
                // Fall back to file storage
            }
        }
        
        // Fall back to file storage
        try
        {
            lock (_lockObject)
            {
                string file = Path.Combine(Config.OutputFilePath, "pointsByReferrerData.518");
                string backupFile = file + "_old";

                // Backup existing file if it exists
                if (File.Exists(file))
                {
                    if (File.Exists(backupFile))
                    {
                        File.Delete(backupFile);
                    }
                    File.Move(file, backupFile);
                }

                // Create new file with updated data
                using StreamWriter writer = new(file);
                foreach (var entry in State.PointsByReferrer)
                {
                    writer.WriteLine(entry.Key + "?" + entry.Value.ToString());
                }
            }
            return true;
        }
        catch (Exception ex)
        {
            string text = $"Error saving pointsByReferrerData to file: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
            return false;
        }
    }

    /// <summary>
    /// Saves user point offset data to file or MongoDB
    /// </summary>
    /// <returns>True if successful, false otherwise</returns>
    public static bool SaveUserPointOffset()
    {
        // Try to save to MongoDB first
        if (State.MongoDb != null)
        {
            try
            {
                // Call the async method synchronously
                Task.Run(async () => await MongoDbSaveMethods.SaveUserPointOffsetAsync()).Wait();
                return true;
            }
            catch (Exception ex)
            {
                string text = $"Error saving user point offset to MongoDB: {ex.Message}. Falling back to file storage.";
                Logging.AddToLog(text);
                Console.WriteLine(text);
                // Fall back to file storage
            }
        }
        
        // Fall back to file storage
        try
        {
            lock (_lockObject)
            {
                string file = Path.Combine(Config.OutputFilePath, "userPointOffsetData.518");
                string backupFile = file + "_old";

                // Backup existing file if it exists
                if (File.Exists(file))
                {
                    if (File.Exists(backupFile))
                    {
                        File.Delete(backupFile);
                    }
                    File.Move(file, backupFile);
                }

                // Create new file with updated data
                using StreamWriter writer = new(file);
                foreach (var entry in State.UserPointOffset)
                {
                    writer.WriteLine(entry.Key + "?" + entry.Value.ToString());
                }
            }
            return true;
        }
        catch (Exception ex)
        {
            string text = $"Error saving userPointOffsetData to file: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
            return false;
        }
    }

    /// <summary>
    /// Saves joined referrals data to file or MongoDB
    /// </summary>
    /// <returns>True if successful, false otherwise</returns>
    public static bool SaveJoinedReferrals()
    {
        // Try to save to MongoDB first
        if (State.MongoDb != null)
        {
            try
            {
                // Call the async method synchronously
                Task.Run(async () => await MongoDbSaveMethods.SaveJoinedReferralsAsync()).Wait();
                return true;
            }
            catch (Exception ex)
            {
                string text = $"Error saving joined referrals to MongoDB: {ex.Message}. Falling back to file storage.";
                Logging.AddToLog(text);
                Console.WriteLine(text);
                // Fall back to file storage
            }
        }
        
        // Fall back to file storage
        try
        {
            lock (_lockObject)
            {
                string file = Path.Combine(Config.OutputFilePath, "joinedReferralsData.518");
                string backupFile = file + "_old";

                // Backup existing file if it exists
                if (File.Exists(file))
                {
                    if (File.Exists(backupFile))
                    {
                        File.Delete(backupFile);
                    }
                    File.Move(file, backupFile);
                }

                // Create new file with updated data
                using StreamWriter writer = new(file);
                foreach (var entry in State.JoinedReferrals)
                {
                    writer.WriteLine(entry.Key.ToString() + "?" + entry.Value);
                }
            }
            return true;
        }
        catch (Exception ex)
        {
            string text = $"Error saving joinedReferralsData to file: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
            return false;
        }
    }

    /// <summary>
    /// Saves referral points data to file or MongoDB
    /// </summary>
    /// <returns>True if successful, false otherwise</returns>
    public static bool SaveReferralPoints()
    {
        // Try to save to MongoDB first
        if (State.MongoDb != null)
        {
            try
            {
                // Call the async method synchronously
                Task.Run(async () => await MongoDbSaveMethods.SaveReferralPointsAsync()).Wait();
                return true;
            }
            catch (Exception ex)
            {
                string text = $"Error saving referral points to MongoDB: {ex.Message}. Falling back to file storage.";
                Logging.AddToLog(text);
                Console.WriteLine(text);
                // Fall back to file storage
            }
        }
        
        // Fall back to file storage
        try
        {
            lock (_lockObject)
            {
                string file = Path.Combine(Config.OutputFilePath, "referralPointsData.518");
                string backupFile = file + "_old";

                // Backup existing file if it exists
                if (File.Exists(file))
                {
                    if (File.Exists(backupFile))
                    {
                        File.Delete(backupFile);
                    }
                    File.Move(file, backupFile);
                }

                // Create new file with updated data
                using StreamWriter writer = new(file);
                foreach (var entry in State.ReferralPoints)
                {
                    writer.WriteLine(entry.Key + "?" + entry.Value.ToString());
                }
            }
            return true;
        }
        catch (Exception ex)
        {
            string text = $"Error saving referralPointsData to file: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
            return false;
        }
    }

    /// <summary>
    /// Saves interacted user data to file or MongoDB
    /// </summary>
    /// <returns>True if successful, false otherwise</returns>
    public static bool SaveInteractedUser()
    {
        // Try to save to MongoDB first
        if (State.MongoDb != null)
        {
            try
            {
                // Call the async method synchronously
                Task.Run(async () => await MongoDbSaveMethods.SaveInteractedUserAsync()).Wait();
                return true;
            }
            catch (Exception ex)
            {
                string text = $"Error saving interacted user to MongoDB: {ex.Message}. Falling back to file storage.";
                Logging.AddToLog(text);
                Console.WriteLine(text);
                // Fall back to file storage
            }
        }
        
        // Fall back to file storage
        try
        {
            lock (_lockObject)
            {
                string file = Path.Combine(Config.OutputFilePath, "interactedUserData.518");
                string backupFile = file + "_old";

                // Backup existing file if it exists
                if (File.Exists(file))
                {
                    if (File.Exists(backupFile))
                    {
                        File.Delete(backupFile);
                    }
                    File.Move(file, backupFile);
                }

                // Create new file with updated data
                using StreamWriter writer = new(file);
                foreach (var entry in State.InteractedUser)
                {
                    string result = entry.Key.ToString() + "?????";
                    foreach (var value in entry.Value)
                    {
                        result += "&&&&&" + value.Key + "#####" + value.Value;
                    }
                    writer.WriteLine(result);
                }
            }
            return true;
        }
        catch (Exception ex)
        {
            string text = $"Error saving interactedUserData to file: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
            return false;
        }
    }

    /// <summary>
    /// Saves disable notice data to file or MongoDB
    /// </summary>
    /// <returns>True if successful, false otherwise</returns>
    public static bool SaveDisableNotice()
    {
        // Try to save to MongoDB first
        if (State.MongoDb != null)
        {
            try
            {
                // Call the async method synchronously
                Task.Run(async () => await MongoDbSaveMethods.SaveDisableNoticeAsync()).Wait();
                return true;
            }
            catch (Exception ex)
            {
                string text = $"Error saving disable notice to MongoDB: {ex.Message}. Falling back to file storage.";
                Logging.AddToLog(text);
                Console.WriteLine(text);
                // Fall back to file storage
            }
        }
        
        // Fall back to file storage
        try
        {
            lock (_lockObject)
            {
                string file = Path.Combine(Config.OutputFilePath, "disableNoticeData.518");
                string backupFile = file + "_old";

                // Backup existing file if it exists
                if (File.Exists(file))
                {
                    if (File.Exists(backupFile))
                    {
                        File.Delete(backupFile);
                    }
                    File.Move(file, backupFile);
                }

                // Create new file with updated data
                using StreamWriter writer = new(file);
                foreach (var entry in State.DisableNotice)
                {
                    writer.WriteLine(entry);
                }
            }
            return true;
        }
        catch (Exception ex)
        {
            string text = $"Error saving disableNoticeData to file: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
            return false;
        }
    }

    /// <summary>
    /// Saves campaign days data to file or MongoDB
    /// </summary>
    /// <returns>True if successful, false otherwise</returns>
    public static bool SaveCampaignDays()
    {
        // Try to save to MongoDB first
        if (State.MongoDb != null)
        {
            try
            {
                // Call the async method synchronously
                Task.Run(async () => await MongoDbSaveMethods.SaveCampaignDaysAsync()).Wait();
                return true;
            }
            catch (Exception ex)
            {
                string text = $"Error saving campaign days to MongoDB: {ex.Message}. Falling back to file storage.";
                Logging.AddToLog(text);
                Console.WriteLine(text);
                // Fall back to file storage
            }
        }
        
        // Fall back to file storage
        try
        {
            lock (_lockObject)
            {
                string file = Path.Combine(Config.OutputFilePath, "campaignDaysData.518");
                string backupFile = file + "_old";

                // Backup existing file if it exists
                if (File.Exists(file))
                {
                    if (File.Exists(backupFile))
                    {
                        File.Delete(backupFile);
                    }
                    File.Move(file, backupFile);
                }

                // Create new file with updated data
                using StreamWriter writer = new(file);
                foreach (var entry in State.CampaignDays)
                {
                    writer.WriteLine(entry);
                }
            }
            return true;
        }
        catch (Exception ex)
        {
            string text = $"Error saving campaignDaysData to file: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
            return false;
        }
    }
}
