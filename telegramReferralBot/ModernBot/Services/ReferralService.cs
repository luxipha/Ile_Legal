using System;
using System.Threading.Tasks;
using Telegram.Bot;
using TelegramReferralBot.Models;
using Microsoft.Extensions.Logging;
using Telegram.Bot.Types;
using System.Text;
using System.Security.Cryptography;

namespace TelegramReferralBot.Services
{
    public class ReferralService
    {
        private readonly ITelegramBotClient _botClient;
        private readonly MongoDbService _mongoDb;
        private readonly ILogger _logger;
        private readonly ActivityService _activityService;
        private readonly PointsService _pointsService;

        public ReferralService(ITelegramBotClient botClient, MongoDbService mongoDb, ActivityService activityService, PointsService pointsService, ILogger logger)
        {
            _botClient = botClient;
            _mongoDb = mongoDb;
            _activityService = activityService;
            _pointsService = pointsService;
            _logger = logger;
        }

        /// <summary>
        /// Gets or creates a referral link for a user
        /// </summary>
        public async Task<string> GetReferralLinkAsync(string userId)
        {
            try
            {
                // Try to get existing referral link
                var refLink = await _mongoDb.GetRefLinkByUserIdAsync(userId);
                if (refLink != null)
                {
                    var botUsername = (await _botClient.GetMeAsync()).Username;
                    return $"https://t.me/{botUsername}?start={refLink.RefCode}";
                }

                // Create new referral link
                var chat = await _botClient.GetChatAsync(long.Parse(userId));
                var telegramUser = new User
                {
                    Id = long.Parse(userId),
                    FirstName = chat.FirstName,
                    LastName = chat.LastName,
                    Username = chat.Username
                };

                // Generate a unique referral code
                string referralCode = GenerateReferralCode(userId);
                
                // Store new referral link
                var newRefLink = new RefLinkModel
                {
                    UserId = userId,
                    RefCode = referralCode,
                    CreatedAt = DateTime.UtcNow
                };

                await _mongoDb.CreateRefLinkAsync(newRefLink);
                _logger.Log(LogLevel.Information, new EventId(0), $"Created new referral link for user {userId}", null, (s, e) => s);

                var botName = (await _botClient.GetMeAsync()).Username;
                return $"https://t.me/{botName}?start={referralCode}";
            }
            catch (Exception ex)
            {
                _logger.Log(LogLevel.Information, new EventId(0), $"Error creating referral link: {ex.Message}", null, (s, e) => s);
                throw;
            }
        }

        /// <summary>
        /// Handles a user clicking a referral link
        /// </summary>
        public async Task HandleReferralClickAsync(string referredId, string referralCode)
        {
            try
            {
                Console.WriteLine($"[DEBUG] REFERRAL: Processing referral click from user {referredId} with code {referralCode}");
                
                // Get referrer ID from referral code
                Console.WriteLine($"[DEBUG] REFERRAL: Looking up referrer ID for code {referralCode}");
                string referrerId = await _mongoDb.GetUserIdByRefCodeAsync(referralCode);
                
                if (string.IsNullOrEmpty(referrerId))
                {
                    Console.WriteLine($"[DEBUG] REFERRAL ERROR: Invalid referral code: {referralCode}");
                    _logger.Log(LogLevel.Information, new EventId(0), $"Invalid referral code: {referralCode}", null, (s, e) => s);
                    return;
                }
                
                Console.WriteLine($"[DEBUG] REFERRAL: Found referrer ID {referrerId} for code {referralCode}");
                
                // Check if this referral already exists
                Console.WriteLine($"[DEBUG] REFERRAL: Checking if referral already exists for {referrerId} -> {referredId}");
                var existingReferral = await _mongoDb.GetReferralByUserIdsAsync(referrerId, referredId);
                
                if (existingReferral != null)
                {
                    Console.WriteLine($"[DEBUG] REFERRAL: Referral already exists for {referrerId} -> {referredId}, status: {existingReferral.Status}");
                    
                    // If the referral is already completed, no need to do anything
                    if (existingReferral.Status == "completed")
                    {
                        Console.WriteLine($"[DEBUG] REFERRAL: Referral already completed for {referrerId} -> {referredId}");
                        return;
                    }
                    
                    // If the referral exists but is pending, mark it as completed now
                    Console.WriteLine($"[DEBUG] REFERRAL: Updating existing referral from pending to completed for {referrerId} -> {referredId}");
                    await _mongoDb.UpdateReferralStatusAsync(existingReferral.Id, "completed");
                }
                else
                {
                    // Create new referral record - mark as completed immediately
                    Console.WriteLine($"[DEBUG] REFERRAL: Creating new referral record for {referrerId} -> {referredId}");
                    
                    var referral = new ReferralModel
                    {
                        ReferrerId = referrerId,
                        ReferredId = referredId,
                        Points = Config.ReferralReward,
                        Timestamp = DateTime.UtcNow,
                        Type = "referral",
                        Status = "completed" // Mark as completed immediately
                    };

                    await _mongoDb.CreateReferralAsync(referral);
                    Console.WriteLine($"[DEBUG] REFERRAL: Successfully created referral record for {referrerId} -> {referredId}");
                    _logger.Log(LogLevel.Information, new EventId(0), $"Created referral: {referrerId} -> {referredId}", null, (s, e) => s);
                }

                // Award JOIN_REWARD to the referred user
                Console.WriteLine($"[DEBUG] REFERRAL: Awarding join bonus to referred user {referredId}");
                await _pointsService.AwardJoinBonusAsync(referredId);
                
                // Award REFERRAL_REWARD to the referrer
                Console.WriteLine($"[DEBUG] REFERRAL: Awarding referral bonus to referrer {referrerId}");
                await _pointsService.AwardReferralBonusAsync(referrerId, referredId);

                // Notify referrer
                try
                {
                    Console.WriteLine($"[DEBUG] REFERRAL: Notifying referrer {referrerId} about new referral");
                    await _botClient.SendTextMessageAsync(
                        chatId: long.Parse(referrerId),
                        text: $"{referredId} clicked your referral link! You'll earn {Config.ReferralReward} Bricks when they join the group 🎉"
                    );
                    Console.WriteLine($"[DEBUG] REFERRAL: Successfully notified referrer {referrerId}");
                }
                catch (Exception notifyEx)
                {
                    Console.WriteLine($"[DEBUG] REFERRAL WARNING: Could not notify referrer {referrerId}: {notifyEx.Message}");
                    _logger.Log(LogLevel.Warning, new EventId(0), $"Could not notify referrer {referrerId}: {notifyEx.Message}", null, (s, e) => s);
                    // Continue execution even if notification fails
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] REFERRAL ERROR: Error handling referral click: {ex.Message}");
                _logger.Log(LogLevel.Error, new EventId(0), $"Error handling referral click: {ex.Message}", null, (s, e) => s);
                // Re-throw to allow proper error handling upstream
                throw;
            }
        }

        private string GenerateReferralCode(string userId)
        {
            // Generate a new referral link using base64 encoding
            var inputBytes = Encoding.UTF8.GetBytes(userId);
            
            // Special "url-safe" base64 encode
            string base64String = Convert.ToBase64String(inputBytes)
                .Replace('+', '-')
                .Replace('/', '_')
                .Replace("=", "");
            
            // Check if this base64 string is already used by another user
            string existingUser = null;
            try {
                existingUser = _mongoDb.GetUserIdByRefCodeAsync(base64String).Result;
            } catch (Exception) {
                // Ignore errors and proceed with generating a code
            }
            
            if (!string.IsNullOrEmpty(existingUser) && existingUser != userId)
            {
                // Generate a random string instead
                byte[] randomBytes = new byte[8];
                using var rng = RandomNumberGenerator.Create();
                rng.GetBytes(randomBytes);
                
                base64String = Convert.ToBase64String(randomBytes)
                    .Replace('+', '-')
                    .Replace('/', '_')
                    .Replace("=", "");
            }
            
            return base64String;
        }
    }
}
