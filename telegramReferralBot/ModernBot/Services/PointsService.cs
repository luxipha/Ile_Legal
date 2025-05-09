using System;
using System.Threading.Tasks;
using Telegram.Bot;
using TelegramReferralBot.Models;
using Microsoft.Extensions.Logging;

namespace TelegramReferralBot.Services
{
    public class PointsService
    {
        private readonly ITelegramBotClient _botClient;
        private readonly MongoDbService _mongoDb;
        private readonly ILogger _logger;

        public PointsService(ITelegramBotClient botClient, MongoDbService mongoDb, ILogger logger)
        {
            _botClient = botClient;
            _mongoDb = mongoDb;
            _logger = logger;
        }

        /// <summary>
        /// Awards points to a user and sends them a notification
        /// </summary>
        public async Task AwardPointsAsync(string userId, int points, string reason)
        {
            try
            {
                Console.WriteLine($"[DEBUG] ===== POINTS AWARD PROCESS START =====\n[DEBUG] REQUEST: Award {points} Bricks to user {userId} for {reason}");
                Console.WriteLine($"[DEBUG] POINTS SOURCE: {new System.Diagnostics.StackTrace().ToString().Split('\n')[2].Trim()}"); // Show caller method
                _logger.Log(LogLevel.Information, new EventId(0), $"REQUEST: Award {points} Bricks to user {userId} for {reason}", null, (s, e) => s);
                
                // Verify points value is positive
                if (points <= 0)
                {
                    Console.WriteLine($"[DEBUG] ERROR: Cannot award non-positive points value: {points}");
                    _logger.Log(LogLevel.Error, new EventId(0), $"Cannot award non-positive points value: {points}", null, (s, e) => s);
                    return;
                }
                
                // Get user's current points before update
                var userBefore = await _mongoDb.GetUserAsync(userId);
                int pointsBefore = userBefore?.BricksTotal ?? 0;
                Console.WriteLine($"[DEBUG] POINTS BEFORE: User {userId} currently has {pointsBefore} Bricks");
                
                // Update points in MongoDB
                Console.WriteLine($"[DEBUG] DB REQUEST: UpdateUserBricksAsync({userId}, {points})");
                bool success = await _mongoDb.UpdateUserBricksAsync(userId, points);
                Console.WriteLine($"[DEBUG] DB RESPONSE: UpdateUserBricksAsync result: {(success ? "Success" : "Failed")}");
                _logger.Log(LogLevel.Information, new EventId(0), $"DB RESPONSE: UpdateUserBricksAsync({userId}, {points}) result: {(success ? "Success" : "Failed")}", null, (s, e) => s);

                if (!success)
                {
                    Console.WriteLine($"[DEBUG] ERROR: Failed to update Bricks for user {userId} in database");
                    _logger.Log(LogLevel.Error, new EventId(0), $"Failed to update Bricks for user {userId} in database", null, (s, e) => s);
                    return;
                }

                // Get updated points to verify
                Console.WriteLine($"[DEBUG] DB REQUEST: GetPointsAsync({userId})");
                int currentPoints = await GetPointsAsync(userId);
                Console.WriteLine($"[DEBUG] POINTS AFTER: User {userId} now has {currentPoints} total Bricks (Added {points}, Expected total: {pointsBefore + points})");
                
                // Verify the points were added correctly
                if (currentPoints != pointsBefore + points)
                {
                    Console.WriteLine($"[DEBUG] WARNING: Points mismatch! Expected {pointsBefore + points} but got {currentPoints}");
                }
                
                _logger.Log(LogLevel.Information, new EventId(0), $"User {userId} now has {currentPoints} total Bricks after adding {points}", null, (s, e) => s);

                // Send notification
                try {
                    Console.WriteLine($"[DEBUG] TELEGRAM REQUEST: Sending notification to user {userId}");
                    await _botClient.SendTextMessageAsync(
                        chatId: long.Parse(userId),
                        text: $"🎉 You've earned {points} Bricks for {reason}!"
                    );
                    Console.WriteLine($"[DEBUG] TELEGRAM RESPONSE: Notification sent to user {userId}");
                    _logger.Log(LogLevel.Information, new EventId(0), $"Notification sent to user {userId} about earning {points} Bricks", null, (s, e) => s);
                } catch (Exception notifyEx) {
                    Console.WriteLine($"[DEBUG] ERROR: Failed to send notification to user {userId}: {notifyEx.Message}");
                    _logger.Log(LogLevel.Error, new EventId(0), $"Failed to send notification to user {userId}: {notifyEx.Message}", null, (s, e) => s);
                }
                
                Console.WriteLine($"[DEBUG] ===== POINTS AWARD PROCESS COMPLETE =====");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] ERROR: Error awarding points: {ex.Message}");
                Console.WriteLine($"[DEBUG] ERROR STACK: {ex.StackTrace}");
                _logger.Log(LogLevel.Error, new EventId(0), $"Error awarding points: {ex.Message}", ex, (s, e) => s);
                throw;
            }
        }

        /// <summary>
        /// Gets a user's current points
        /// </summary>
        public async Task<int> GetPointsAsync(string userId)
        {
            try
            {
                Console.WriteLine($"[DEBUG] DB REQUEST: GetUserAsync({userId})");
                _logger.Log(LogLevel.Information, new EventId(0), $"DB REQUEST: GetUserAsync({userId})", null, (s, e) => s);
                
                var user = await _mongoDb.GetUserAsync(userId);
                
                if (user == null)
                {
                    Console.WriteLine($"[DEBUG] DB RESPONSE: User {userId} not found in database");
                    _logger.Log(LogLevel.Information, new EventId(0), $"DB RESPONSE: User {userId} not found in database", null, (s, e) => s);
                    return 0;
                }
                
                int bricksTotal = user.BricksTotal;
                Console.WriteLine($"[DEBUG] DB RESPONSE: User {userId} has {bricksTotal} Bricks (BricksTotal: {user.BricksTotal}, Balance: {user.Balance})");
                _logger.Log(LogLevel.Information, new EventId(0), $"DB RESPONSE: User {userId} has {bricksTotal} Bricks", null, (s, e) => s);
                
                return bricksTotal;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] ERROR: Exception in GetPointsAsync for user {userId}: {ex.Message}");
                _logger.Log(LogLevel.Error, new EventId(0), $"Error getting points for user {userId}: {ex.Message}", ex, (s, e) => s);
                return 0; // Return 0 instead of throwing to avoid cascading errors
            }
        }

        /// <summary>
        /// Awards join bonus to a new member
        /// </summary>
        public async Task AwardJoinBonusAsync(string userId)
        {
            try
            {
                Console.WriteLine($"[DEBUG] REQUEST: Award join bonus to user {userId}");
                _logger.Log(LogLevel.Information, new EventId(0), $"REQUEST: Award join bonus to user {userId}", null, (s, e) => s);
                
                // Get join reward from environment variable directly
                int joinReward = 30; // Default value
                string joinRewardStr = Environment.GetEnvironmentVariable("JOIN_REWARD");
                if (!string.IsNullOrEmpty(joinRewardStr) && int.TryParse(joinRewardStr, out int envJoinReward))
                {
                    joinReward = envJoinReward;
                }
                Console.WriteLine($"[DEBUG] Using join reward value: {joinReward}");
                
                // Check if user already exists and has points
                Console.WriteLine($"[DEBUG] DB REQUEST: GetUserAsync({userId})");
                var user = await _mongoDb.GetUserAsync(userId);
                
                if (user == null)
                {
                    Console.WriteLine($"[DEBUG] DB RESPONSE: User {userId} not found, will award join bonus");
                    await AwardPointsAsync(userId, joinReward, "joining the group");
                }
                else if (user.BricksTotal == 0)
                {
                    Console.WriteLine($"[DEBUG] DB RESPONSE: User {userId} exists but has 0 Bricks, will award join bonus");
                    await AwardPointsAsync(userId, joinReward, "joining the group");
                }
                else
                {
                    Console.WriteLine($"[DEBUG] DB RESPONSE: User {userId} already has {user.BricksTotal} Bricks, skipping join bonus");
                    _logger.Log(LogLevel.Information, new EventId(0), $"User {userId} already has {user.BricksTotal} Bricks, skipping join bonus", null, (s, e) => s);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] ERROR: Exception in AwardJoinBonusAsync for user {userId}: {ex.Message}");
                _logger.Log(LogLevel.Error, new EventId(0), $"Error awarding join bonus to user {userId}: {ex.Message}", ex, (s, e) => s);
            }
        }

        /// <summary>
        /// Awards referral bonus to the referrer
        /// </summary>
        public async Task AwardReferralBonusAsync(string referrerId, string referredId)
        {
            try
            {
                Console.WriteLine($"[DEBUG] REQUEST: Award referral bonus to user {referrerId} for referring {referredId}");
                _logger.Log(LogLevel.Information, new EventId(0), $"REQUEST: Award referral bonus to user {referrerId} for referring {referredId}", null, (s, e) => s);
                
                // Get referral reward from environment variable directly
                int referralReward = 150; // Default value
                string referralRewardStr = Environment.GetEnvironmentVariable("REFERRAL_REWARD");
                if (!string.IsNullOrEmpty(referralRewardStr) && int.TryParse(referralRewardStr, out int envReferralReward))
                {
                    referralReward = envReferralReward;
                }
                Console.WriteLine($"[DEBUG] Using referral reward value: {referralReward}");
                
                // Check if referrer exists
                Console.WriteLine($"[DEBUG] DB REQUEST: GetUserAsync({referrerId})");
                var referrer = await _mongoDb.GetUserAsync(referrerId);
                
                if (referrer == null)
                {
                    Console.WriteLine($"[DEBUG] DB RESPONSE: Referrer {referrerId} not found in database, creating new user");
                }
                else
                {
                    Console.WriteLine($"[DEBUG] DB RESPONSE: Referrer {referrerId} found with {referrer.BricksTotal} Bricks");
                }
                
                // Award points to the referrer
                await AwardPointsAsync(referrerId, referralReward, "your referred user joining the group");
                
                // Add the referral to the referrer's list of referrals
                Console.WriteLine($"[DEBUG] DB REQUEST: Adding referral {referredId} to referrer {referrerId}");
                bool addReferralResult = await _mongoDb.AddReferralToUserAsync(referrerId, referredId, "Unknown", referralReward);
                Console.WriteLine($"[DEBUG] DB RESPONSE: AddReferralToUserAsync result: {(addReferralResult ? "Success" : "Failed")}");
                
                _logger.Log(LogLevel.Information, new EventId(0), $"Awarded referral bonus of {referralReward} Bricks to {referrerId} for referring {referredId}", null, (s, e) => s);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] ERROR: Exception in AwardReferralBonusAsync for referrer {referrerId}: {ex.Message}");
                _logger.Log(LogLevel.Error, new EventId(0), $"Error awarding referral bonus to {referrerId} for referring {referredId}: {ex.Message}", ex, (s, e) => s);
            }
        }

        /// <summary>
        /// Creates a new user in the database
        /// </summary>
        public async Task<bool> CreateUserAsync(UserModel user)
        {
            try
            {
                Console.WriteLine($"[DEBUG] POINTS SERVICE: Creating new user {user.TelegramId}");
                _logger.Log(LogLevel.Information, new EventId(0), $"Creating new user {user.TelegramId}", null, (s, e) => s);
                
                // Create user in MongoDB
                await _mongoDb.CreateUserAsync(user);
                
                Console.WriteLine($"[DEBUG] POINTS SERVICE: Successfully created user {user.TelegramId}");
                _logger.Log(LogLevel.Information, new EventId(0), $"Successfully created user {user.TelegramId}", null, (s, e) => s);
                
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] POINTS SERVICE ERROR: Failed to create user {user.TelegramId}: {ex.Message}");
                _logger.Log(LogLevel.Error, new EventId(0), $"Failed to create user {user.TelegramId}: {ex.Message}", null, (s, e) => s);
                return false;
            }
        }

        /// <summary>
        /// Gets a user from MongoDB by their Telegram ID
        /// </summary>
        public async Task<UserModel?> GetUserAsync(string userId)
        {
            try
            {
                return await _mongoDb.GetUserAsync(userId);
            }
            catch (Exception ex)
            {
                _logger.Log(LogLevel.Error, new EventId(0), $"Error getting user: {ex.Message}", ex, (s, e) => s);
                throw;
            }
        }
    }
}
