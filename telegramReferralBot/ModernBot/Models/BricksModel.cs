using MongoDB.Bson.Serialization.Attributes;

namespace TelegramReferralBot.Models
{
    public class BricksModel
    {
        [BsonElement("total")]
        public int Total { get; set; }

        [BsonElement("referrals")]
        public int ReferralPoints { get; set; }

        [BsonElement("messages")]
        public int MessagePoints { get; set; }

        [BsonElement("streak")]
        public int StreakPoints { get; set; }

        [BsonElement("leaderboard")]
        public int LeaderboardPoints { get; set; }

        [BsonElement("lastRedeemTime")]
        public DateTime? LastRedeemTime { get; set; }
    }
}
