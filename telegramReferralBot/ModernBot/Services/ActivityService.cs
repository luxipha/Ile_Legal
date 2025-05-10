using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using TelegramReferralBot.Models;
using TelegramReferralBot.Utils;

namespace TelegramReferralBot.Services
{
    public class ActivityService
    {
        private readonly MongoDbService _mongoDbService;
        private readonly ILogger<ActivityService> _logger;

        public ActivityService(MongoDbService mongoDbService, ILogger<ActivityService> logger)
        {
            _mongoDbService = mongoDbService;
            _logger = logger;
        }

        public async Task LogActivityAsync(string userId, string type, int points = 0)
        {
            try
            {
                var activity = new ActivityModel
                {
                    UserId = userId,
                    Type = type,
                    Points = points,
                    Date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                    Timestamp = DateTime.UtcNow
                };

                await _mongoDbService.CreateActivityAsync(activity);
                _logger.LogInformation($"Activity logged for user {userId}: {type} ({points} points)");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error logging activity for user {userId}: {ex.Message}");
                throw;
            }
        }

        public async Task<int> GetTodayActivityCountAsync(string userId, string type)
        {
            try
            {
                var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
                var activities = await _mongoDbService.GetTodayActivitiesAsync(userId, type, today);
                return activities?.Count ?? 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting today's activity count for user {userId}: {ex.Message}");
                throw;
            }
        }
    }
}
