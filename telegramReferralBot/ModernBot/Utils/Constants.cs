namespace TelegramReferralBot.Utils
{
    public static class Constants
    {
        // Activity Types
        public static class ActivityType
        {
            public const string Message = "message";
            public const string Referral = "referral";
            public const string JoinGroup = "join_group";
        }

        // Referral Status
        public static class ReferralStatus
        {
            public const string Pending = "pending";
            public const string Completed = "completed";
            public const string Expired = "expired";
        }

        // Point Values
        public static class Points
        {
            public const int MessageReward = 1;
            public const int ReferralReward = 150;
            public const int JoinReward = 30;
            public const int StreakReward = 300;
            public const int LeaderboardReward = 200;
            public const int DailyMessageLimit = 10;
        }

        // Command Prefixes
        public static class Commands
        {
            public const string Start = "/start";
            public const string Help = "/help";
            public const string MyPoints = "/mypoints";
            public const string GetRefLink = "/getreflink";
            public const string Leaderboard = "/leaderboard";
            public const string Journey = "/journey";
        }

        // Error Messages
        public static class ErrorMessages
        {
            public const string InvalidReferralCode = "Invalid referral code";
            public const string DailyLimitReached = "Daily message limit reached";
            public const string AlreadyJoined = "User has already joined";
            public const string NotInGroup = "User is not in the group";
        }

        // Success Messages
        public static class SuccessMessages
        {
            public const string ReferralSuccess = "Successfully referred a user";
            public const string PointsAwarded = "Points awarded successfully";
            public const string JoinedGroup = "Successfully joined the group";
        }
    }
}
