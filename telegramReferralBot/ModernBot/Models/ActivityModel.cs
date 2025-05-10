using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace TelegramReferralBot.Models
{
    public class ActivityModel
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("userId")]
        public string? UserId { get; set; }

        [BsonElement("referrerId")]
        public string? ReferrerId { get; set; }

        [BsonElement("type")]
        public string? Type { get; set; }

        [BsonElement("points")]
        public int Points { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("date")]
        public string? Date { get; set; }

        [BsonElement("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [BsonElement("count")]
        public int Count { get; set; }
    }
}
