using System;
using Microsoft.Extensions.Logging;

namespace TelegramReferralBot.Utils
{
    public static class Config
    {
        // Bot Configuration
        public static string BotToken { get; private set; }
        public static long GroupChatId { get; private set; }
        public static string AdminUserId { get; private set; }
        public static string AdminPassword { get; private set; }
        public static string LinkGroup { get; private set; }

        // MongoDB settings
        public static string MongoConnectionString { get; private set; }
        public static string MongoDatabaseName { get; private set; }

        // API settings
        public static string ApiBaseUrl { get; private set; }
        public static string ApiKey { get; private set; }
        public static string BackendUrl { get; private set; }

        // Logging settings
        public static string LogFilePath { get; private set; }
        public static LogLevel MinimumLogLevel { get; private set; }

        // Rewards Configuration
        public static int JoinReward { get; private set; } = 30;
        public static int ReferralReward { get; private set; } = 150;
        public static int MessageReward { get; private set; } = 5;
        public static int LeaderboardReward { get; private set; } = 100;
        public static int StreakReward { get; private set; } = 50;

        // Limits Configuration
        public static int MaxPointsPerDay { get; private set; } = 100;
        public static int MaxPasswordAttempts { get; private set; } = 3;
        public static int ThresholdForMessagePoint { get; private set; } = 5; // Minimum message length to earn points

        public static void Initialize()
        {
            Console.WriteLine("[CONFIG] Loading configuration from environment variables...");
            
            // Load from environment variables
            BotToken = Environment.GetEnvironmentVariable("BOT_TOKEN") ?? throw new Exception("BOT_TOKEN not set");
            GroupChatId = long.Parse(Environment.GetEnvironmentVariable("GROUP_CHAT_ID") ?? "0");
            AdminUserId = Environment.GetEnvironmentVariable("ADMIN_USER_ID") ?? "";
            AdminPassword = Environment.GetEnvironmentVariable("ADMIN_PASSWORD") ?? "";
            LinkGroup = Environment.GetEnvironmentVariable("LINK_GROUP") ?? "";
            Console.WriteLine($"[CONFIG] LinkGroup: {LinkGroup}");

            MongoConnectionString = Environment.GetEnvironmentVariable("MONGODB_CONNECTION_STRING") ?? throw new Exception("MONGODB_CONNECTION_STRING not set");
            MongoDatabaseName = Environment.GetEnvironmentVariable("MONGODB_DATABASE_NAME") ?? throw new Exception("MONGODB_DATABASE_NAME not set");

            ApiBaseUrl = Environment.GetEnvironmentVariable("API_BASE_URL") ?? "http://localhost:3000";
            ApiKey = Environment.GetEnvironmentVariable("API_KEY") ?? "";
            BackendUrl = Environment.GetEnvironmentVariable("BACKEND_URL") ?? "";

            LogFilePath = Environment.GetEnvironmentVariable("LOG_FILE_PATH") ?? "logs/bot.log";
            MinimumLogLevel = Enum.TryParse<LogLevel>(Environment.GetEnvironmentVariable("MIN_LOG_LEVEL"), out var level) ? level : LogLevel.Information;

            // Load rewards configuration
            string joinRewardStr = Environment.GetEnvironmentVariable("JOIN_REWARD");
            if (int.TryParse(joinRewardStr, out var joinReward))
            {
                JoinReward = joinReward;
                Console.WriteLine($"[CONFIG] JOIN_REWARD: {JoinReward}");
            }
            else
            {
                Console.WriteLine($"[CONFIG] Using default JOIN_REWARD: {JoinReward}");
            }
            
            string referralRewardStr = Environment.GetEnvironmentVariable("REFERRAL_REWARD");
            if (int.TryParse(referralRewardStr, out var referralReward))
            {
                ReferralReward = referralReward;
                Console.WriteLine($"[CONFIG] REFERRAL_REWARD: {ReferralReward}");
            }
            else
            {
                Console.WriteLine($"[CONFIG] Using default REFERRAL_REWARD: {ReferralReward}");
            }
            
            string messageRewardStr = Environment.GetEnvironmentVariable("MESSAGE_REWARD");
            if (int.TryParse(messageRewardStr, out var messageReward))
            {
                MessageReward = messageReward;
                Console.WriteLine($"[CONFIG] MESSAGE_REWARD: {MessageReward}");
            }
            else
            {
                Console.WriteLine($"[CONFIG] Using default MESSAGE_REWARD: {MessageReward}");
            }
            
            string leaderboardRewardStr = Environment.GetEnvironmentVariable("LEADERBOARD_REWARD");
            if (int.TryParse(leaderboardRewardStr, out var leaderboardReward))
            {
                LeaderboardReward = leaderboardReward;
                Console.WriteLine($"[CONFIG] LEADERBOARD_REWARD: {LeaderboardReward}");
            }
            else
            {
                Console.WriteLine($"[CONFIG] Using default LEADERBOARD_REWARD: {LeaderboardReward}");
            }
            
            string streakRewardStr = Environment.GetEnvironmentVariable("STREAK_REWARD");
            if (int.TryParse(streakRewardStr, out var streakReward))
            {
                StreakReward = streakReward;
                Console.WriteLine($"[CONFIG] STREAK_REWARD: {StreakReward}");
            }
            else
            {
                Console.WriteLine($"[CONFIG] Using default STREAK_REWARD: {StreakReward}");
            }
            
            // Load limits configuration
            string maxPointsStr = Environment.GetEnvironmentVariable("MAX_POINTS_PER_DAY");
            if (int.TryParse(maxPointsStr, out var maxPoints))
            {
                MaxPointsPerDay = maxPoints;
                Console.WriteLine($"[CONFIG] MAX_POINTS_PER_DAY: {MaxPointsPerDay}");
            }
            else
            {
                Console.WriteLine($"[CONFIG] Using default MAX_POINTS_PER_DAY: {MaxPointsPerDay}");
            }
            
            string thresholdStr = Environment.GetEnvironmentVariable("THRESHOLD_FOR_MESSAGE_POINT");
            if (int.TryParse(thresholdStr, out var threshold))
            {
                ThresholdForMessagePoint = threshold;
                Console.WriteLine($"[CONFIG] THRESHOLD_FOR_MESSAGE_POINT: {ThresholdForMessagePoint}");
            }
            else
            {
                Console.WriteLine($"[CONFIG] Using default THRESHOLD_FOR_MESSAGE_POINT: {ThresholdForMessagePoint}");
            }
            
            string maxAttemptsStr = Environment.GetEnvironmentVariable("MAX_PASSWORD_ATTEMPTS");
            if (int.TryParse(maxAttemptsStr, out var maxAttempts))
            {
                MaxPasswordAttempts = maxAttempts;
                Console.WriteLine($"[CONFIG] MAX_PASSWORD_ATTEMPTS: {MaxPasswordAttempts}");
            }
            else
            {
                Console.WriteLine($"[CONFIG] Using default MAX_PASSWORD_ATTEMPTS: {MaxPasswordAttempts}");
            }
            
            // Ensure MaxPointsPerDay is never 0
            if (MaxPointsPerDay <= 0)
            {
                MaxPointsPerDay = 20; // Default value if something goes wrong
                Console.WriteLine($"[CONFIG] MaxPointsPerDay was 0 or negative, reset to {MaxPointsPerDay}");
            }
            
            Console.WriteLine("[CONFIG] Configuration loaded successfully");
        }
    }
}
