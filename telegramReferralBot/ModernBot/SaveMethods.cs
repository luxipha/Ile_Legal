namespace TelegramReferralBot;

/// <summary>
/// Handles saving data to persistent storage for the Telegram Referral Bot
/// </summary>
public static class SaveMethods
{
    private static readonly object _lockObject = new();

    /// <summary>
    /// Saves user activity data to file
    /// </summary>
    /// <returns>True if successful, false otherwise</returns>
    public static bool SaveUserActivity()
    {
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
                foreach (var entry in Program.UserActivity)
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
            string text = $"Error saving userActivityData: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
            return false;
        }
    }

    /// <summary>
    /// Saves referral links data to file
    /// </summary>
    /// <returns>True if successful, false otherwise</returns>
    public static bool SaveRefLinks()
    {
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
                foreach (var entry in Program.RefLinks)
                {
                    writer.WriteLine(entry.Key + "?" + entry.Value);
                }
            }
            return true;
        }
        catch (Exception ex)
        {
            string text = $"Error saving refLinksData: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
            return false;
        }
    }

    /// <summary>
    /// Saves password attempts data to file
    /// </summary>
    /// <returns>True if successful, false otherwise</returns>
    public static bool SavePasswordAttempts()
    {
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
                foreach (var entry in Program.PasswordAttempts)
                {
                    writer.WriteLine(entry.Key + "?" + entry.Value.ToString());
                }
            }
            return true;
        }
        catch (Exception ex)
        {
            string text = $"Error saving passwordAttemptsData: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
            return false;
        }
    }

    /// <summary>
    /// Saves show welcome data to file
    /// </summary>
    /// <returns>True if successful, false otherwise</returns>
    public static bool SaveShowWelcome()
    {
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
                foreach (var entry in Program.ShowWelcome)
                {
                    writer.WriteLine(entry.Key + "?" + entry.Value.ToString());
                }
            }
            return true;
        }
        catch (Exception ex)
        {
            string text = $"Error saving showWelcomeData: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
            return false;
        }
    }

    /// <summary>
    /// Saves referred by data to file
    /// </summary>
    /// <returns>True if successful, false otherwise</returns>
    public static bool SaveReferredBy()
    {
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
                foreach (var entry in Program.ReferredBy)
                {
                    writer.WriteLine(entry.Key + "?" + entry.Value);
                }
            }
            return true;
        }
        catch (Exception ex)
        {
            string text = $"Error saving referredByData: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
            return false;
        }
    }

    /// <summary>
    /// Saves group chat ID number to file
    /// </summary>
    /// <returns>True if successful, false otherwise</returns>
    public static bool SaveGroupChatIdNumber()
    {
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
            string text = $"Error saving groupIDnumber: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
            return false;
        }
    }

    /// <summary>
    /// Saves points by referrer data to file
    /// </summary>
    /// <returns>True if successful, false otherwise</returns>
    public static bool SavePointsByReferrer()
    {
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
                foreach (var entry in Program.PointsByReferrer)
                {
                    writer.WriteLine(entry.Key + "?" + entry.Value.ToString());
                }
            }
            return true;
        }
        catch (Exception ex)
        {
            string text = $"Error saving pointsByReferrerData: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
            return false;
        }
    }

    /// <summary>
    /// Saves user point offset data to file
    /// </summary>
    /// <returns>True if successful, false otherwise</returns>
    public static bool SaveUserPointOffset()
    {
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
                foreach (var entry in Program.UserPointOffset)
                {
                    writer.WriteLine(entry.Key + "?" + entry.Value.ToString());
                }
            }
            return true;
        }
        catch (Exception ex)
        {
            string text = $"Error saving userPointOffsetData: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
            return false;
        }
    }

    /// <summary>
    /// Saves joined referrals data to file
    /// </summary>
    /// <returns>True if successful, false otherwise</returns>
    public static bool SaveJoinedReferrals()
    {
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
                foreach (var entry in Program.JoinedReferrals)
                {
                    writer.WriteLine(entry.Key.ToString() + "?" + entry.Value);
                }
            }
            return true;
        }
        catch (Exception ex)
        {
            string text = $"Error saving joinedReferralsData: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
            return false;
        }
    }

    /// <summary>
    /// Saves referral points data to file
    /// </summary>
    /// <returns>True if successful, false otherwise</returns>
    public static bool SaveReferralPoints()
    {
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
                foreach (var entry in Program.ReferralPoints)
                {
                    writer.WriteLine(entry.Key + "?" + entry.Value.ToString());
                }
            }
            return true;
        }
        catch (Exception ex)
        {
            string text = $"Error saving referralPointsData: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
            return false;
        }
    }

    /// <summary>
    /// Saves interacted user data to file
    /// </summary>
    /// <returns>True if successful, false otherwise</returns>
    public static bool SaveInteractedUser()
    {
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
                foreach (var entry in Program.InteractedUser)
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
            string text = $"Error saving interactedUserData: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
            return false;
        }
    }

    /// <summary>
    /// Saves disable notice data to file
    /// </summary>
    /// <returns>True if successful, false otherwise</returns>
    public static bool SaveDisableNotice()
    {
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
                foreach (var entry in Program.DisableNotice)
                {
                    writer.WriteLine(entry);
                }
            }
            return true;
        }
        catch (Exception ex)
        {
            string text = $"Error saving disableNoticeData: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
            return false;
        }
    }

    /// <summary>
    /// Saves campaign days data to file
    /// </summary>
    /// <returns>True if successful, false otherwise</returns>
    public static bool SaveCampaignDays()
    {
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
                foreach (var entry in Program.CampaignDays)
                {
                    writer.WriteLine(entry);
                }
            }
            return true;
        }
        catch (Exception ex)
        {
            string text = $"Error saving campaignDaysData: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
            return false;
        }
    }
}
