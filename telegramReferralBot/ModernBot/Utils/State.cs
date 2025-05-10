using System;
using System.Collections.Generic;
using Telegram.Bot;
using TelegramReferralBot.Services;

namespace TelegramReferralBot.Utils
{
    public static class State
    {
        public static TelegramBotClient? BotClient { get; set; }
        public static MongoDbService? MongoDb { get; set; }
        public static Dictionary<string, bool> ShowWelcome { get; set; } = new();
        public static Dictionary<string, string> RefLinks { get; set; } = new();
        public static Dictionary<string, int> PasswordAttempts { get; set; } = new();
        public static Dictionary<string, Dictionary<string, int>> UserActivity { get; set; } = new();
        public static Dictionary<string, string> ReferredBy { get; set; } = new();
        public static Dictionary<string, int> PointTotals { get; set; } = new();
        public static Dictionary<string, int> UserPointOffset { get; set; } = new();
        public static Dictionary<string, int> PointsByReferrer { get; set; } = new();
        public static Dictionary<string, bool> JoinedReferrals { get; set; } = new();
        public static Dictionary<string, int> ReferralPoints { get; set; } = new();
        public static Dictionary<int, Dictionary<string, string>> InteractedUser { get; set; } = new();
        public static List<string> CampaignDays { get; set; } = new();
        public static List<string> DisableNotice { get; set; } = new();
    }
}
