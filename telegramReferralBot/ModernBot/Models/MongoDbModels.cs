using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;

namespace TelegramReferralBot.Models
{
    /// <summary>
    /// Enum representing the user's join state in the group
    /// </summary>
    public enum JoinState
    {
        NotJoined,        // User has not joined the group yet
        JoinedNotActive,  // User has joined but not active
        Active            // User is active in the group
    }

    /// <summary>
    /// User model aligned with backend User schema
    /// </summary>
    [BsonIgnoreExtraElements]
    public class UserModel
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }
        
        [BsonElement("__v")]
        public int Version { get; set; }
        
        [BsonElement("email")]
        public string? Email { get; set; }
        
        [BsonElement("name")]
        public string? Name { get; set; }
        
        [BsonElement("balance")]
        public int Balance { get; set; }
        
        [BsonElement("isAdmin")]
        public bool IsAdmin { get; set; }
        
        [BsonElement("isBanned")]
        public bool IsBanned { get; set; }
        
        [BsonElement("telegramChatId")]
        public string TelegramId { get; set; } = string.Empty;
        
        // Custom fields for the bot that we'll store in the user document
        [BsonElement("telegramUsername")]
        public string? Username { get; set; }
        
        [BsonElement("telegramFirstName")]
        public string? FirstName { get; set; }
        
        [BsonElement("telegramLastName")]
        public string? LastName { get; set; }
        
        [BsonElement("referralCode")]
        public string? ReferralCode { get; set; }
        
        [BsonElement("passwordAttempts")]
        public int PasswordAttempts { get; set; }
        
        [BsonElement("showWelcome")]
        public bool ShowWelcome { get; set; } = true;
        
        // Nested bricks object to match backend schema
        [BsonElement("bricks")]
        public BricksModel Bricks { get; set; } = new BricksModel();
        
        // Referrals array to match backend schema
        [BsonElement("referrals")]
        public List<ReferralEntryModel> Referrals { get; set; } = new List<ReferralEntryModel>();
        
        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; }
        
        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; }
        
        // Helper property to get/set BricksTotal directly
        [BsonIgnore]
        public int BricksTotal
        {
            get { return Bricks?.Total ?? 0; }
            set 
            { 
                if (Bricks == null) 
                    Bricks = new BricksModel();
                Bricks.Total = value; 
            }
        }
        
        // Helper property to get ReferralsCount
        [BsonIgnore]
        public int ReferralsCount => Referrals?.Count ?? 0;
        
        // Group join state tracking
        [BsonElement("joinState")]
        public JoinState JoinState { get; set; } = JoinState.NotJoined;
        
        // Daily streak tracking
        [BsonElement("streakCount")]
        public int StreakCount { get; set; } = 0;
        
        [BsonElement("lastActivityDate")]
        public DateTime? LastActivityDate { get; set; }
        
        // Reminder system tracking
        [BsonElement("lastReminderSent")]
        public DateTime? LastReminderSent { get; set; }
        
        [BsonElement("firstInteractionDate")]
        public DateTime? FirstInteractionDate { get; set; }
    }
    
    /// <summary>
    /// Referral entry model to match the referrals array in the backend schema
    /// </summary>
    [BsonIgnoreExtraElements]
    public class ReferralEntryModel
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }
        
        [BsonElement("userId")]
        public string? UserId { get; set; }
        
        [BsonElement("name")]
        public string? Name { get; set; }
        
        [BsonElement("status")]
        public string? Status { get; set; } = "joined";
        
        [BsonElement("joinedAt")]
        public DateTime? JoinedAt { get; set; } = DateTime.UtcNow;
        
        [BsonElement("bricksEarned")]
        public int BricksEarned { get; set; }
    }
    
    /// <summary>
    /// Referral relationship stored in MongoDB
    /// </summary>
    public class ReferralModel
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }
        
        [BsonElement("referrerId")]
        public string? ReferrerId { get; set; }
        
        [BsonElement("referredId")]
        public string? ReferredId { get; set; }
        
        [BsonElement("points")]
        public int Points { get; set; }
        
        [BsonElement("timestamp")]
        public DateTime Timestamp { get; set; }
        
        [BsonElement("status")]
        public string? Status { get; set; }
        
        [BsonElement("type")]
        public string? Type { get; set; } // "referral", "join_group", "group_activity"
        
        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; }
    }
    

    
    /// <summary>
    /// Referral link mapping stored in MongoDB
    /// </summary>
}
