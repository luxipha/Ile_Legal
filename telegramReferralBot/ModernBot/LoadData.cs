using Telegram.Bot;
using Telegram.Bot.Types;
using File = System.IO.File;

namespace TelegramReferralBot;

/// <summary>
/// Handles loading configuration and data for the Telegram Referral Bot
/// </summary>
public static class LoadData
{
    /// <summary>
    /// Loads configuration from the config file
    /// </summary>
    public static bool LoadConf()
    {
        string message = "Beginning load config.";
        Logging.AddToLog(message);
        Console.WriteLine(message);

        string directory = AppDomain.CurrentDomain.BaseDirectory;

        if (!string.IsNullOrWhiteSpace(directory))
        {
            string message1 = "Found path: " + directory;
            Logging.AddToLog(message1);
            Console.WriteLine(message1);

            string outputFolder = Path.Combine(directory, "Output");
            Config.OutputFilePath = outputFolder;
            
            // Create output folder if it doesn't exist
            if (!Directory.Exists(outputFolder))
            {
                Directory.CreateDirectory(outputFolder);
            }
            
            string configFile = Path.Combine(directory, "config.conf");
            if (File.Exists(configFile))
            {
                List<string> temp = File.ReadAllLines(configFile).ToList();
                bool error = false;
                foreach (string s in temp)
                {
                    if (s.StartsWith("bot="))
                    {
                        string[] parse = s.Split('=');
                        if(parse.Length == 2 && !string.IsNullOrWhiteSpace(parse[1]) && !parse[1].Contains('<') && !parse[1].Contains('>'))
                        {
                            Config.BotAccessToken = parse[1];
                        }
                        else
                        {
                            error = true;
                        }
                    }
                    else if (s.StartsWith("linkGroup="))
                    {
                        string[] parse = s.Split('=');
                        if (parse.Length == 2 && !string.IsNullOrWhiteSpace(parse[1]) && !parse[1].Contains('<') && !parse[1].Contains('>'))
                        {
                            Config.LinkToGroup = parse[1];
                        }
                        else
                        {
                            error = true;
                        }
                    }
                    else if (s.StartsWith("linkBot="))
                    {
                        string[] parse = s.Split('=');
                        if (parse.Length == 2 && !string.IsNullOrWhiteSpace(parse[1]) && !parse[1].Contains('<') && !parse[1].Contains('>'))
                        {
                            Config.LinkToBot = parse[1];
                        }
                        else
                        {
                            error = true;
                        }
                    }
                    else if (s.StartsWith("pw="))
                    {
                        string[] parse = s.Split('=');
                        if (parse.Length == 2 && !string.IsNullOrWhiteSpace(parse[1]) && !parse[1].Contains('<') && !parse[1].Contains('>'))
                        {
                            Config.AdminPassword = parse[1];
                        }
                        else
                        {
                            error = true;
                        }
                    }
                    else if (s.StartsWith("start="))
                    {
                        string[] parse = s.Split('=');
                        if (parse.Length == 2 && !string.IsNullOrWhiteSpace(parse[1]) && !parse[1].Contains('<') && !parse[1].Contains('>'))
                        {
                            Config.StartDate = parse[1];
                        }
                        else
                        {
                            error = true;
                        }
                    }
                    else if (s.StartsWith("days="))
                    {
                        string[] parse = s.Split('=');
                        if (parse.Length == 2 && !string.IsNullOrWhiteSpace(parse[1]) && !parse[1].Contains('<') && !parse[1].Contains('>'))
                        {
                            if (int.TryParse(parse[1], out int days))
                            {
                                Config.NumberOfDays = days;
                            }
                            else
                            {
                                error = true;
                            }
                        }
                        else
                        {
                            error = true;
                        }
                    }
                    else if (s.StartsWith("max="))
                    {
                        string[] parse = s.Split('=');
                        if (parse.Length == 2 && !string.IsNullOrWhiteSpace(parse[1]) && !parse[1].Contains('<') && !parse[1].Contains('>'))
                        {
                            if (int.TryParse(parse[1], out int max))
                            {
                                Config.MaxPointsPerDay = max;
                            }
                            else
                            {
                                error = true;
                            }
                        }
                        else
                        {
                            error = true;
                        }
                    }
                    else if (s.StartsWith("threshold="))
                    {
                        string[] parse = s.Split('=');
                        if (parse.Length == 2 && !string.IsNullOrWhiteSpace(parse[1]) && !parse[1].Contains('<') && !parse[1].Contains('>'))
                        {
                            if (int.TryParse(parse[1], out int threshold))
                            {
                                Config.ThresholdForMessagePoint = threshold;
                            }
                            else
                            {
                                error = true;
                            }
                        }
                        else
                        {
                            error = true;
                        }
                    }
                    else if (s.StartsWith("joinReward="))
                    {
                        string[] parse = s.Split('=');
                        if (parse.Length == 2 && !string.IsNullOrWhiteSpace(parse[1]) && !parse[1].Contains('<') && !parse[1].Contains('>'))
                        {
                            if (int.TryParse(parse[1], out int joinReward))
                            {
                                Config.JoinReward = joinReward;
                            }
                            else
                            {
                                error = true;
                            }
                        }
                        else
                        {
                            error = true;
                        }
                    }
                    else if (s.StartsWith("referralReward="))
                    {
                        string[] parse = s.Split('=');
                        if (parse.Length == 2 && !string.IsNullOrWhiteSpace(parse[1]) && !parse[1].Contains('<') && !parse[1].Contains('>'))
                        {
                            if (int.TryParse(parse[1], out int referralReward))
                            {
                                Config.ReferralReward = referralReward;
                            }
                            else
                            {
                                error = true;
                            }
                        }
                        else
                        {
                            error = true;
                        }
                    }
                    else if (s.StartsWith("streakReward="))
                    {
                        string[] parse = s.Split('=');
                        if (parse.Length == 2 && !string.IsNullOrWhiteSpace(parse[1]) && !parse[1].Contains('<') && !parse[1].Contains('>'))
                        {
                            if (int.TryParse(parse[1], out int streakReward))
                            {
                                Config.StreakReward = streakReward;
                            }
                            else
                            {
                                error = true;
                            }
                        }
                        else
                        {
                            error = true;
                        }
                    }
                    else if (s.StartsWith("leaderboardReward="))
                    {
                        string[] parse = s.Split('=');
                        if (parse.Length == 2 && !string.IsNullOrWhiteSpace(parse[1]) && !parse[1].Contains('<') && !parse[1].Contains('>'))
                        {
                            if (int.TryParse(parse[1], out int leaderboardReward))
                            {
                                Config.LeaderboardReward = leaderboardReward;
                            }
                            else
                            {
                                error = true;
                            }
                        }
                        else
                        {
                            error = true;
                        }
                    }
                    else if (s.StartsWith("mongoDbConnectionString=") || s.StartsWith("mongoDb="))
                    {
                        string[] parse = s.Split('=');
                        if (parse.Length == 2 && !string.IsNullOrWhiteSpace(parse[1]) && !parse[1].Contains('<') && !parse[1].Contains('>'))
                        {
                            Config.MongoDbConnectionString = parse[1];
                        }
                        else
                        {
                            error = true;
                        }
                    }
                    else if (s.StartsWith("mongoDbDatabaseName=") || s.StartsWith("mongoDbName="))
                    {
                        string[] parse = s.Split('=');
                        if (parse.Length == 2 && !string.IsNullOrWhiteSpace(parse[1]) && !parse[1].Contains('<') && !parse[1].Contains('>'))
                        {
                            Config.MongoDbDatabaseName = parse[1];
                        }
                        else
                        {
                            error = true;
                        }
                    }
                }

                if (error)
                {
                    string text = "Error! Config file has errors.";
                    Logging.AddToLog(text);
                    Console.WriteLine(text);
                }
                else
                {
                    string text = "Config file loaded.";
                    Logging.AddToLog(text);
                    Console.WriteLine(text);
                }
            }
            else
            {
                string text = "Error! Could not find config file.";
                Logging.AddToLog(text);
                Console.WriteLine(text);
            }

            // Load group chat ID number
            string groupIDFile = Path.Combine(Config.OutputFilePath, "groupIDnumber.518");
            string backupGroupIDFile = groupIDFile + "_old";

            if (File.Exists(groupIDFile))
            {
                string groupID = File.ReadAllText(groupIDFile);
                if (long.TryParse(groupID, out long id))
                {
                    Config.GroupChatIdNumber = id;
                    string text = "groupIDnumber loaded.";
                    Logging.AddToLog(text);
                    Console.WriteLine(text);
                }
                else
                {
                    string text = "Error parsing groupIDnumber. Value set to default (0).";
                    Logging.AddToLog(text);
                    Console.WriteLine(text);
                }
            }
            else if (File.Exists(backupGroupIDFile))
            {
                string groupID = File.ReadAllText(backupGroupIDFile);
                if (long.TryParse(groupID, out long id))
                {
                    Config.GroupChatIdNumber = id;
                    string text = "groupIDnumber loaded from backup.";
                    Logging.AddToLog(text);
                    Console.WriteLine(text);
                }
                else
                {
                    string text = "Error parsing groupIDnumber from backup. Value set to default (0).";
                    Logging.AddToLog(text);
                    Console.WriteLine(text);
                }
            }
            else
            {
                string text = "groupIDnumber file not found. Value set to default (0).";
                Logging.AddToLog(text);
                Console.WriteLine(text);
            }

            // Load user data files
            LoadUserData();
            
            // Load campaign days
            LoadCampaignDays();
            return true;
        }
        return false;
    }

    /// <summary>
    /// Loads user data from files
    /// </summary>
    private static void LoadUserData()
    {
        // Load user activity data
        string userActivityFile = Path.Combine(Config.OutputFilePath, "userActivityData.518");
        string backupUserActivityFile = userActivityFile + "_old";

        if (File.Exists(userActivityFile))
        {
            LoadUserActivityData(userActivityFile);
        }
        else if (File.Exists(backupUserActivityFile))
        {
            LoadUserActivityData(backupUserActivityFile);
        }

        // Load referral links data
        string refLinksFile = Path.Combine(Config.OutputFilePath, "refLinksData.518");
        string backupRefLinksFile = refLinksFile + "_old";

        if (File.Exists(refLinksFile))
        {
            LoadRefLinksData(refLinksFile);
        }
        else if (File.Exists(backupRefLinksFile))
        {
            LoadRefLinksData(backupRefLinksFile);
        }

        // Load password attempts data
        string passwordAttemptsFile = Path.Combine(Config.OutputFilePath, "passwordAttemptsData.518");
        string backupPasswordAttemptsFile = passwordAttemptsFile + "_old";

        if (File.Exists(passwordAttemptsFile))
        {
            LoadPasswordAttemptsData(passwordAttemptsFile);
        }
        else if (File.Exists(backupPasswordAttemptsFile))
        {
            LoadPasswordAttemptsData(backupPasswordAttemptsFile);
        }

        // Load show welcome data
        string showWelcomeFile = Path.Combine(Config.OutputFilePath, "showWelcomeData.518");
        string backupShowWelcomeFile = showWelcomeFile + "_old";

        if (File.Exists(showWelcomeFile))
        {
            LoadShowWelcomeData(showWelcomeFile);
        }
        else if (File.Exists(backupShowWelcomeFile))
        {
            LoadShowWelcomeData(backupShowWelcomeFile);
        }

        // Load referred by data
        string referredByFile = Path.Combine(Config.OutputFilePath, "referredByData.518");
        string backupReferredByFile = referredByFile + "_old";

        if (File.Exists(referredByFile))
        {
            LoadReferredByData(referredByFile);
        }
        else if (File.Exists(backupReferredByFile))
        {
            LoadReferredByData(backupReferredByFile);
        }

        // Load points by referrer data
        string pointsByReferrerFile = Path.Combine(Config.OutputFilePath, "pointsByReferrerData.518");
        string backupPointsByReferrerFile = pointsByReferrerFile + "_old";

        if (File.Exists(pointsByReferrerFile))
        {
            LoadPointsByReferrerData(pointsByReferrerFile);
        }
        else if (File.Exists(backupPointsByReferrerFile))
        {
            LoadPointsByReferrerData(backupPointsByReferrerFile);
        }

        // Load user point offset data
        string userPointOffsetFile = Path.Combine(Config.OutputFilePath, "userPointOffsetData.518");
        string backupUserPointOffsetFile = userPointOffsetFile + "_old";

        if (File.Exists(userPointOffsetFile))
        {
            LoadUserPointOffsetData(userPointOffsetFile);
        }
        else if (File.Exists(backupUserPointOffsetFile))
        {
            LoadUserPointOffsetData(backupUserPointOffsetFile);
        }

        // Load joined referrals data
        string joinedReferralsFile = Path.Combine(Config.OutputFilePath, "joinedReferralsData.518");
        string backupJoinedReferralsFile = joinedReferralsFile + "_old";

        if (File.Exists(joinedReferralsFile))
        {
            LoadJoinedReferralsData(joinedReferralsFile);
        }
        else if (File.Exists(backupJoinedReferralsFile))
        {
            LoadJoinedReferralsData(backupJoinedReferralsFile);
        }

        // Load referral points data
        string referralPointsFile = Path.Combine(Config.OutputFilePath, "referralPointsData.518");
        string backupReferralPointsFile = referralPointsFile + "_old";

        if (File.Exists(referralPointsFile))
        {
            LoadReferralPointsData(referralPointsFile);
        }
        else if (File.Exists(backupReferralPointsFile))
        {
            LoadReferralPointsData(backupReferralPointsFile);
        }

        // Load interacted user data
        string interactedUserFile = Path.Combine(Config.OutputFilePath, "interactedUserData.518");
        string backupInteractedUserFile = interactedUserFile + "_old";

        if (File.Exists(interactedUserFile))
        {
            LoadInteractedUserData(interactedUserFile);
        }
        else if (File.Exists(backupInteractedUserFile))
        {
            LoadInteractedUserData(backupInteractedUserFile);
        }

        // Load disable notice data
        string disableNoticeFile = Path.Combine(Config.OutputFilePath, "disableNoticeData.518");
        string backupDisableNoticeFile = disableNoticeFile + "_old";

        if (File.Exists(disableNoticeFile))
        {
            Program.DisableNotice.Clear();
            Program.DisableNotice = File.ReadAllLines(disableNoticeFile).ToList();
            string text = "disableNoticeData loaded.";
            Logging.AddToLog(text);
            Console.WriteLine(text);
        }
        else if (File.Exists(backupDisableNoticeFile))
        {
            Program.DisableNotice.Clear();
            Program.DisableNotice = File.ReadAllLines(backupDisableNoticeFile).ToList();
            string text = "disableNoticeData loaded from backup.";
            Logging.AddToLog(text);
            Console.WriteLine(text);
        }
    }

    private static void LoadUserActivityData(string filePath)
    {
        try
        {
            Program.UserActivity.Clear();
            List<string> lines = File.ReadAllLines(filePath).ToList();
            
            foreach (string s in lines)
            {
                string[] parts = s.Split('?');
                string userId = parts[0];
                Dictionary<string, int> perDay = new();
                
                for (int i = 1; i < parts.Length; i++)
                {
                    string[] dayParts = parts[i].Split('&');
                    if (dayParts.Length == 2)
                    {
                        string date = dayParts[0];
                        if (int.TryParse(dayParts[1], out int count))
                        {
                            perDay.Add(date, count);
                        }
                    }
                }
                
                Program.UserActivity.Add(userId, perDay);
            }
            
            string text = "userActivityData loaded.";
            Logging.AddToLog(text);
            Console.WriteLine(text);
        }
        catch (Exception ex)
        {
            string text = $"Error loading userActivityData: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
        }
    }

    private static void LoadRefLinksData(string filePath)
    {
        try
        {
            Program.RefLinks.Clear();
            List<string> lines = File.ReadAllLines(filePath).ToList();
            
            foreach (string s in lines)
            {
                string[] parts = s.Split('?');
                if (parts.Length == 2)
                {
                    Program.RefLinks.Add(parts[0], parts[1]);
                }
            }
            
            string text = "refLinksData loaded.";
            Logging.AddToLog(text);
            Console.WriteLine(text);
        }
        catch (Exception ex)
        {
            string text = $"Error loading refLinksData: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
        }
    }

    private static void LoadPasswordAttemptsData(string filePath)
    {
        try
        {
            Program.PasswordAttempts.Clear();
            List<string> lines = File.ReadAllLines(filePath).ToList();
            
            foreach (string s in lines)
            {
                string[] parts = s.Split('?');
                if (parts.Length == 2 && int.TryParse(parts[1], out int attempts))
                {
                    Program.PasswordAttempts.Add(parts[0], attempts);
                }
            }
            
            string text = "passwordAttemptsData loaded.";
            Logging.AddToLog(text);
            Console.WriteLine(text);
        }
        catch (Exception ex)
        {
            string text = $"Error loading passwordAttemptsData: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
        }
    }

    private static void LoadShowWelcomeData(string filePath)
    {
        try
        {
            Program.ShowWelcome.Clear();
            List<string> lines = File.ReadAllLines(filePath).ToList();
            
            foreach (string s in lines)
            {
                string[] parts = s.Split('?');
                if (parts.Length == 2 && bool.TryParse(parts[1], out bool showWelcome))
                {
                    Program.ShowWelcome.Add(parts[0], showWelcome);
                }
            }
            
            string text = "showWelcomeData loaded.";
            Logging.AddToLog(text);
            Console.WriteLine(text);
        }
        catch (Exception ex)
        {
            string text = $"Error loading showWelcomeData: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
        }
    }

    private static void LoadReferredByData(string filePath)
    {
        try
        {
            Program.ReferredBy.Clear();
            List<string> lines = File.ReadAllLines(filePath).ToList();
            
            foreach (string s in lines)
            {
                string[] parts = s.Split('?');
                if (parts.Length == 2)
                {
                    Program.ReferredBy.Add(parts[0], parts[1]);
                }
            }
            
            string text = "referredByData loaded.";
            Logging.AddToLog(text);
            Console.WriteLine(text);
        }
        catch (Exception ex)
        {
            string text = $"Error loading referredByData: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
        }
    }

    private static void LoadPointsByReferrerData(string filePath)
    {
        try
        {
            Program.PointsByReferrer.Clear();
            List<string> lines = File.ReadAllLines(filePath).ToList();
            
            foreach (string s in lines)
            {
                string[] parts = s.Split('?');
                if (parts.Length == 2 && int.TryParse(parts[1], out int points))
                {
                    Program.PointsByReferrer.Add(parts[0], points);
                }
            }
            
            string text = "pointsByReferrerData loaded.";
            Logging.AddToLog(text);
            Console.WriteLine(text);
        }
        catch (Exception ex)
        {
            string text = $"Error loading pointsByReferrerData: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
        }
    }

    private static void LoadUserPointOffsetData(string filePath)
    {
        try
        {
            Program.UserPointOffset.Clear();
            List<string> lines = File.ReadAllLines(filePath).ToList();
            
            foreach (string s in lines)
            {
                string[] parts = s.Split('?');
                if (parts.Length == 2 && int.TryParse(parts[1], out int offset))
                {
                    Program.UserPointOffset.Add(parts[0], offset);
                }
            }
            
            string text = "userPointOffsetData loaded.";
            Logging.AddToLog(text);
            Console.WriteLine(text);
        }
        catch (Exception ex)
        {
            string text = $"Error loading userPointOffsetData: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
        }
    }

    private static void LoadJoinedReferralsData(string filePath)
    {
        try
        {
            Program.JoinedReferrals.Clear();
            List<string> lines = File.ReadAllLines(filePath).ToList();
            
            foreach (string s in lines)
            {
                string[] parts = s.Split('?');
                if (parts.Length == 2)
                {
                    string userId = parts[0];
                    bool joined = parts[1].Equals("true", StringComparison.OrdinalIgnoreCase);
                    Program.JoinedReferrals.Add(userId, joined);
                }
            }
            
            string text = "joinedReferralsData loaded.";
            Logging.AddToLog(text);
            Console.WriteLine(text);
        }
        catch (Exception ex)
        {
            string text = $"Error loading joinedReferralsData: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
        }
    }

    private static void LoadReferralPointsData(string filePath)
    {
        try
        {
            Program.ReferralPoints.Clear();
            List<string> lines = File.ReadAllLines(filePath).ToList();
            
            foreach (string s in lines)
            {
                string[] parts = s.Split('?');
                if (parts.Length == 2 && int.TryParse(parts[1], out int points))
                {
                    Program.ReferralPoints.Add(parts[0], points);
                }
            }
            
            string text = "referralPointsData loaded.";
            Logging.AddToLog(text);
            Console.WriteLine(text);
        }
        catch (Exception ex)
        {
            string text = $"Error loading referralPointsData: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
        }
    }

    private static void LoadInteractedUserData(string filePath)
    {
        try
        {
            Program.InteractedUser.Clear();
            List<string> lines = File.ReadAllLines(filePath).ToList();
            
            foreach (string s in lines)
            {
                string[] temp = s.Split("?????");
                if (temp.Length >= 2)
                {
                    try
                    {
                        int value = Convert.ToInt32(temp[0]);
                        Dictionary<string, string> result = new();
                        string[] data = temp[1].Split("&&&&&");
                        foreach (string s1 in data)
                        {
                            string[] temp1 = s1.Split("#####");
                            if (temp1.Length == 2)
                            {
                                result.Add(temp1[0], temp1[1]);
                            }
                        }
                        Program.InteractedUser.Add(value, result);
                    }
                    catch
                    {
                        Console.WriteLine("Unable to add " + s + " to interactedUser");
                    }
                }
            }
            
            string text = "interactedUserData loaded.";
            Logging.AddToLog(text);
            Console.WriteLine(text);
        }
        catch (Exception ex)
        {
            string text = $"Error loading interactedUserData: {ex.Message}";
            Logging.AddToLog(text);
            Console.WriteLine(text);
        }
    }

    /// <summary>
    /// Loads campaign days data
    /// </summary>
    private static void LoadCampaignDays()
    {
        string campaignDaysFile = Path.Combine(Config.OutputFilePath, "campaignDaysData.518");
        string backupCampaignDaysFile = campaignDaysFile + "_old";

        if (File.Exists(campaignDaysFile))
        {
            Program.CampaignDays.Clear();
            Program.CampaignDays = File.ReadAllLines(campaignDaysFile).ToList();
            Program.CampaignDays.Sort();
            string text = "campaignDaysData loaded.";
            Logging.AddToLog(text);
            Console.WriteLine(text);
        }
        else if (File.Exists(backupCampaignDaysFile))
        {
            Program.CampaignDays.Clear();
            Program.CampaignDays = File.ReadAllLines(backupCampaignDaysFile).ToList();
            Program.CampaignDays.Sort();
            string text = "campaignDaysData loaded from backup.";
            Logging.AddToLog(text);
            Console.WriteLine(text);
        }
        else
        {
            CreateCampaignDays();
        }
    }

    /// <summary>
    /// Gets information about a Telegram group
    /// </summary>
    /// <param name="groupId">Group ID</param>
    /// <returns>Chat object containing group information</returns>
    public static async Task<Chat> GetGroup(long groupId)
    {
        string text = "Start getGroup.";
        Logging.AddToLog(text);
        Console.WriteLine(text);

        var group = await Program.BotClient.GetChatAsync(groupId);
        return group;
    }

    /// <summary>
    /// Creates the campaign days list based on start date and duration
    /// </summary>
    public static void CreateCampaignDays()
    {
        Program.CampaignDays.Clear();
        
        if (DateTime.TryParse(Config.StartDate, out DateTime startDate))
        {
            for (int i = 0; i < Config.NumberOfDays; i++)
            {
                DateTime dateTime = startDate.AddDays(i);
                string date = dateTime.ToString("MM/dd/yyyy");
                Program.CampaignDays.Add(date);
            }
            
            Logging.AddToLog("Created campaignDays list");
            Console.WriteLine("Starting textwriter campaignDaysData");
            SaveMethods.SaveCampaignDays();
        }
        else
        {
            string text = "Error parsing start date. Could not create campaign days.";
            Logging.AddToLog(text);
            Console.WriteLine(text);
        }
    }

    /// <summary>
    /// Loads configuration from environment variables as a fallback
    /// </summary>
    /// <returns>True if successful, false if there were errors</returns>
    public static bool LoadFromEnvironment()
    {
        Console.WriteLine("Attempting to load configuration from environment variables...");
        bool loaded = false;

        // Try to load from .env file first
        LoadEnvFile();

        // MongoDB connection string
        string? mongoDbConnectionString = Environment.GetEnvironmentVariable("MONGODB_CONNECTION_STRING");
        if (!string.IsNullOrEmpty(mongoDbConnectionString))
        {
            Config.MongoDbConnectionString = mongoDbConnectionString;
            Console.WriteLine("Loaded MongoDB connection string from environment variable");
            loaded = true;
        }

        // MongoDB database name
        string? mongoDbDatabaseName = Environment.GetEnvironmentVariable("MONGODB_DATABASE_NAME");
        if (!string.IsNullOrEmpty(mongoDbDatabaseName))
        {
            Config.MongoDbDatabaseName = mongoDbDatabaseName;
            Console.WriteLine($"Loaded MongoDB database name from environment variable: {mongoDbDatabaseName}");
            loaded = true;
        }

        // Bot token
        string? botToken = Environment.GetEnvironmentVariable("BOT_TOKEN");
        if (!string.IsNullOrEmpty(botToken))
        {
            Config.BotAccessToken = botToken;
            Console.WriteLine("Loaded bot token from environment variable");
            loaded = true;
        }
        
        // Admin password
        string? adminPassword = Environment.GetEnvironmentVariable("ADMIN_PASSWORD");
        if (!string.IsNullOrEmpty(adminPassword))
        {
            Config.AdminPassword = adminPassword;
            Console.WriteLine("Loaded admin password from environment variable");
            loaded = true;
        }
        
        // Link to group
        string? linkToGroup = Environment.GetEnvironmentVariable("LINK_GROUP");
        if (!string.IsNullOrEmpty(linkToGroup))
        {
            Config.LinkToGroup = linkToGroup;
            Console.WriteLine("Loaded link to group from environment variable");
            loaded = true;
        }
        
        // Link to bot
        string? linkToBot = Environment.GetEnvironmentVariable("LINK_BOT");
        if (!string.IsNullOrEmpty(linkToBot))
        {
            Config.LinkToBot = linkToBot;
            Console.WriteLine("Loaded link to bot from environment variable");
            loaded = true;
        }
        
        // Start date
        string? startDate = Environment.GetEnvironmentVariable("START_DATE");
        if (!string.IsNullOrEmpty(startDate))
        {
            Config.StartDate = startDate;
            Console.WriteLine($"Loaded start date from environment variable: {startDate}");
            loaded = true;
        }
        
        // Number of days
        string? numberOfDays = Environment.GetEnvironmentVariable("NUMBER_OF_DAYS");
        if (!string.IsNullOrEmpty(numberOfDays) && int.TryParse(numberOfDays, out int days))
        {
            Config.NumberOfDays = days;
            Console.WriteLine($"Loaded number of days from environment variable: {days}");
            loaded = true;
        }
        
        // Max points per day
        string? maxPointsPerDay = Environment.GetEnvironmentVariable("MAX_POINTS_PER_DAY");
        if (!string.IsNullOrEmpty(maxPointsPerDay) && int.TryParse(maxPointsPerDay, out int max))
        {
            Config.MaxPointsPerDay = max;
            Console.WriteLine($"Loaded max points per day from environment variable: {max}");
            loaded = true;
        }
        
        // Threshold for message point
        string? thresholdForMessagePoint = Environment.GetEnvironmentVariable("THRESHOLD_FOR_MESSAGE_POINT");
        if (!string.IsNullOrEmpty(thresholdForMessagePoint) && int.TryParse(thresholdForMessagePoint, out int threshold))
        {
            Config.ThresholdForMessagePoint = threshold;
            Console.WriteLine($"Loaded threshold for message point from environment variable: {threshold}");
            loaded = true;
        }
        
        // Join reward
        string? joinReward = Environment.GetEnvironmentVariable("JOIN_REWARD");
        if (!string.IsNullOrEmpty(joinReward) && int.TryParse(joinReward, out int join))
        {
            Config.JoinReward = join;
            Console.WriteLine($"Loaded join reward from environment variable: {join}");
            loaded = true;
        }
        
        // Referral reward
        string? referralReward = Environment.GetEnvironmentVariable("REFERRAL_REWARD");
        if (!string.IsNullOrEmpty(referralReward) && int.TryParse(referralReward, out int referral))
        {
            Config.ReferralReward = referral;
            Console.WriteLine($"Loaded referral reward from environment variable: {referral}");
            loaded = true;
        }
        
        // Streak reward
        string? streakReward = Environment.GetEnvironmentVariable("STREAK_REWARD");
        if (!string.IsNullOrEmpty(streakReward) && int.TryParse(streakReward, out int streak))
        {
            Config.StreakReward = streak;
            Console.WriteLine($"Loaded streak reward from environment variable: {streak}");
            loaded = true;
        }
        
        // Leaderboard reward
        string? leaderboardReward = Environment.GetEnvironmentVariable("LEADERBOARD_REWARD");
        if (!string.IsNullOrEmpty(leaderboardReward) && int.TryParse(leaderboardReward, out int leaderboard))
        {
            Config.LeaderboardReward = leaderboard;
            Console.WriteLine($"Loaded leaderboard reward from environment variable: {leaderboard}");
            loaded = true;
        }

        return loaded;
    }

    /// <summary>
    /// Loads environment variables from .env file
    /// </summary>
    private static void LoadEnvFile()
    {
        string envFile = Path.Combine(Directory.GetCurrentDirectory(), ".env");
        Console.WriteLine($"Looking for .env file at: {envFile}");
        
        if (File.Exists(envFile))
        {
            Console.WriteLine(".env file found, loading environment variables...");
            foreach (var line in File.ReadAllLines(envFile))
            {
                if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#"))
                    continue;

                var parts = line.Split('=', 2);
                if (parts.Length != 2)
                    continue;

                var key = parts[0].Trim();
                var value = parts[1].Trim();
                
                // Set environment variable
                Environment.SetEnvironmentVariable(key, value);
                Console.WriteLine($"Set environment variable: {key}");
            }
        }
        else
        {
            Console.WriteLine(".env file not found, using system environment variables only.");
        }
    }
}
