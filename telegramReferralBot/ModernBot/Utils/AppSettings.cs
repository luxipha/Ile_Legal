using System;

namespace TelegramReferralBot.Utils
{
    /// <summary>
    /// Application settings loaded from environment variables
    /// </summary>
    public class AppSettings
    {
        /// <summary>
        /// Link to the Telegram group
        /// </summary>
        public string LinkGroup { get; set; } = string.Empty;
        
        /// <summary>
        /// Link to the Telegram bot
        /// </summary>
        public string LinkBot { get; set; } = string.Empty;
        
        /// <summary>
        /// Points awarded for joining the group
        /// </summary>
        public int JoinReward { get; set; } = 30;
        
        /// <summary>
        /// Points awarded for referring a new user
        /// </summary>
        public int ReferralReward { get; set; } = 150;
        
        /// <summary>
        /// Points awarded for maintaining a streak
        /// </summary>
        public int StreakReward { get; set; } = 300;
    }
}
