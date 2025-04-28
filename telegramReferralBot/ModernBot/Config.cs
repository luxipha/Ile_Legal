namespace TelegramReferralBot;

/// <summary>
/// Static configuration class for the Telegram Referral Bot
/// </summary>
public static class Config
{
    /// <summary>
    /// Telegram Bot API token
    /// </summary>
    public static string BotAccessToken { get; set; } = string.Empty;

    /// <summary>
    /// Path to save output files
    /// </summary>
    public static string OutputFilePath { get; set; } = string.Empty;

    /// <summary>
    /// Link to the Telegram group
    /// </summary>
    public static string LinkToGroup { get; set; } = string.Empty;

    /// <summary>
    /// Link to the Telegram bot
    /// </summary>
    public static string LinkToBot { get; set; } = string.Empty;

    /// <summary>
    /// Admin password for protected commands
    /// </summary>
    public static string AdminPassword { get; set; } = string.Empty;

    /// <summary>
    /// Start date of the referral campaign (MM/dd/yyyy)
    /// </summary>
    public static string StartDate { get; set; } = string.Empty;

    /// <summary>
    /// Number of days the campaign will run
    /// </summary>
    public static int NumberOfDays { get; set; } = 0;

    /// <summary>
    /// Maximum number of points a user can earn per day per referred user
    /// </summary>
    public static int MaxPointsPerDay { get; set; } = 0;

    /// <summary>
    /// Minimum message length to earn points
    /// </summary>
    public static int ThresholdForMessagePoint { get; set; } = 0;

    /// <summary>
    /// Group chat ID number
    /// </summary>
    public static long GroupChatIdNumber { get; set; } = 0;
    
    /// <summary>
    /// Points awarded for joining the Telegram group (Stage 1)
    /// </summary>
    public static int JoinReward { get; set; } = 30;
    
    /// <summary>
    /// Points awarded for successful referral (Stage 2)
    /// </summary>
    public static int ReferralReward { get; set; } = 150;
    
    /// <summary>
    /// Points awarded for maintaining a 7-day streak (Stage 3)
    /// </summary>
    public static int StreakReward { get; set; } = 300;
    
    /// <summary>
    /// Points awarded for winning daily leaderboard (Stage 3)
    /// </summary>
    public static int LeaderboardReward { get; set; } = 200;
}
