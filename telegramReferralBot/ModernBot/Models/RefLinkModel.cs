using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace TelegramReferralBot.Models
{
    public class RefLinkModel
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("userId")]
        public string? UserId { get; set; }

        [BsonElement("refCode")]
        public string? RefCode { get; set; }

        [BsonElement("uses")]
        public int Uses { get; set; }

        [BsonElement("maxUses")]
        public int MaxUses { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("expiresAt")]
        public DateTime? ExpiresAt { get; set; }
    }
}
