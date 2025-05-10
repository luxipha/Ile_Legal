using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Telegram.Bot;
using Telegram.Bot.Types.Enums;
using TelegramReferralBot.Models;
using TelegramReferralBot.Utils;

namespace TelegramReferralBot.Services
{
    /// <summary>
    /// Service for managing user reminders and streak tracking
    /// </summary>
    public class ReminderService
    {
        private readonly ITelegramBotClient _botClient;
        private readonly MongoDbService _mongoDb;
        private readonly ILogger<ReminderService> _logger;
        private readonly string _groupLink;
        private readonly int _joinReward;
        private Timer _reminderTimer;
        private Timer _streakTimer;

        public ReminderService(
            ITelegramBotClient botClient,
            MongoDbService mongoDb,
            ILogger<ReminderService> logger,
            AppSettings appSettings)
        {
            _botClient = botClient;
            _mongoDb = mongoDb;
            _logger = logger;
            _groupLink = appSettings.LinkGroup;
            _joinReward = appSettings.JoinReward;
            
            // Start the reminder timer to run once a day at a specific time (e.g., 12:00 PM)
            StartReminderTimer();
            
            // Start the streak timer to run once a day at midnight
            StartStreakTimer();
        }

        private void StartReminderTimer()
        {
            // Calculate time until next 12:00 PM
            var now = DateTime.Now;
            var nextRun = new DateTime(now.Year, now.Month, now.Day, 12, 0, 0);
            if (now > nextRun)
                nextRun = nextRun.AddDays(1);

            var timeUntilNextRun = nextRun - now;
            _logger.LogInformation($"Reminder service will run in {timeUntilNextRun.TotalHours:F1} hours");

            // Create a timer that triggers once a day
            _reminderTimer = new Timer(
                async _ => await SendRemindersAsync(),
                null,
                timeUntilNextRun,
                TimeSpan.FromDays(1));
        }

        private void StartStreakTimer()
        {
            // Calculate time until next midnight
            var now = DateTime.Now;
            var nextMidnight = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0).AddDays(1);
            var timeUntilMidnight = nextMidnight - now;
            
            _logger.LogInformation($"Streak service will run in {timeUntilMidnight.TotalHours:F1} hours");

            // Create a timer that triggers once a day at midnight
            _streakTimer = new Timer(
                async _ => await ProcessDailyStreaksAsync(),
                null,
                timeUntilMidnight,
                TimeSpan.FromDays(1));
        }

        /// <summary>
        /// Updates a user's join state based on their points and activity
        /// </summary>
        public async Task UpdateUserJoinStateAsync(string userId, int points)
        {
            try
            {
                var user = await _mongoDb.GetUserByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning($"Cannot update join state for non-existent user {userId}");
                    return;
                }

                // Set the first interaction date if not already set
                if (user.FirstInteractionDate == null)
                {
                    user.FirstInteractionDate = DateTime.UtcNow;
                }

                // Update join state based on points
                if (points == 0)
                {
                    user.JoinState = JoinState.NotJoined;
                }
                else if (points == _joinReward)
                {
                    user.JoinState = JoinState.JoinedNotActive;
                }
                else if (points > _joinReward)
                {
                    user.JoinState = JoinState.Active;
                    
                    // Update last activity date for streak tracking
                    user.LastActivityDate = DateTime.UtcNow;
                    
                    // Update streak if this is a new day
                    await UpdateUserStreakAsync(user);
                }

                await _mongoDb.UpdateUserAsync(user);
                _logger.LogInformation($"Updated user {userId} join state to {user.JoinState}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating join state for user {userId}");
            }
        }

        /// <summary>
        /// Updates a user's streak if they've been active today
        /// </summary>
        private async Task UpdateUserStreakAsync(UserModel user)
        {
            try
            {
                var now = DateTime.UtcNow;
                
                // If this is the first activity, initialize streak
                if (user.LastActivityDate == null)
                {
                    user.StreakCount = 1;
                    user.LastActivityDate = now;
                    return;
                }
                
                // Check if the last activity was yesterday
                var lastActivity = user.LastActivityDate.Value;
                var daysSinceLastActivity = (now - lastActivity).TotalDays;
                
                if (daysSinceLastActivity >= 1 && daysSinceLastActivity < 2)
                {
                    // Activity on consecutive days - increment streak
                    user.StreakCount++;
                    user.LastActivityDate = now;
                    
                    // Check for streak milestones and send congratulations
                    if (user.StreakCount == 7 || user.StreakCount == 30 || 
                        user.StreakCount == 100 || user.StreakCount % 50 == 0)
                    {
                        await SendStreakMilestoneMessageAsync(user);
                    }
                }
                else if (daysSinceLastActivity >= 2)
                {
                    // Streak broken - reset to 1
                    user.StreakCount = 1;
                    user.LastActivityDate = now;
                }
                // If less than 1 day, it's still the same day, no streak update needed
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating streak for user {user.TelegramId}");
            }
        }

        /// <summary>
        /// Sends a congratulatory message for streak milestones
        /// </summary>
        private async Task SendStreakMilestoneMessageAsync(UserModel user)
        {
            try
            {
                string message = $"🔥 *Congratulations!* 🔥\n\n" +
                                $"You've maintained a {user.StreakCount}-day streak in our community! " +
                                $"Keep up the great work to earn more rewards.";
                
                await _botClient.SendTextMessageAsync(
                    chatId: user.TelegramId,
                    text: message,
                    parseMode: ParseMode.Markdown);
                
                _logger.LogInformation($"Sent streak milestone message to user {user.TelegramId} for {user.StreakCount} days");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending streak milestone message to user {user.TelegramId}");
            }
        }

        /// <summary>
        /// Processes all users' streaks at midnight
        /// </summary>
        private async Task ProcessDailyStreaksAsync()
        {
            try
            {
                _logger.LogInformation("Processing daily streaks for all users");
                
                // Get all active users
                var activeUsers = await _mongoDb.GetUsersWithStateAsync(JoinState.Active);
                int processed = 0;
                
                foreach (var user in activeUsers)
                {
                    // If user hasn't been active today, they miss a day in their streak
                    if (user.LastActivityDate.HasValue && 
                        (DateTime.UtcNow - user.LastActivityDate.Value).TotalDays >= 1)
                    {
                        // Reset streak
                        user.StreakCount = 0;
                        await _mongoDb.UpdateUserAsync(user);
                        processed++;
                    }
                }
                
                _logger.LogInformation($"Processed streaks for {processed} users");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing daily streaks");
            }
        }

        /// <summary>
        /// Sends reminders to users who haven't joined the group or aren't active
        /// </summary>
        private async Task SendRemindersAsync()
        {
            try
            {
                _logger.LogInformation("Starting to send reminders to users");
                
                // Get users who haven't joined and were invited more than 2 days ago
                var twoDaysAgo = DateTime.UtcNow.AddDays(-2);
                var notJoinedUsers = await _mongoDb.GetUsersForReminderAsync(
                    JoinState.NotJoined, 
                    twoDaysAgo, 
                    TimeSpan.FromDays(3) // Don't send reminders more than once every 3 days
                );
                
                // Get users who joined but aren't active and joined more than 1 day ago
                var oneDayAgo = DateTime.UtcNow.AddDays(-1);
                var inactiveUsers = await _mongoDb.GetUsersForReminderAsync(
                    JoinState.JoinedNotActive, 
                    oneDayAgo, 
                    TimeSpan.FromDays(2) // Don't send reminders more than once every 2 days
                );
                
                int remindersSent = 0;
                
                // Send reminders to users who haven't joined
                foreach (var user in notJoinedUsers)
                {
                    await SendNotJoinedReminderAsync(user);
                    remindersSent++;
                    
                    // Update the last reminder sent timestamp
                    user.LastReminderSent = DateTime.UtcNow;
                    await _mongoDb.UpdateUserAsync(user);
                    
                    // Add a small delay to avoid hitting rate limits
                    await Task.Delay(100);
                }
                
                // Send reminders to inactive users
                foreach (var user in inactiveUsers)
                {
                    await SendInactiveReminderAsync(user);
                    remindersSent++;
                    
                    // Update the last reminder sent timestamp
                    user.LastReminderSent = DateTime.UtcNow;
                    await _mongoDb.UpdateUserAsync(user);
                    
                    // Add a small delay to avoid hitting rate limits
                    await Task.Delay(100);
                }
                
                _logger.LogInformation($"Sent {remindersSent} reminders ({notJoinedUsers.Count} not joined, {inactiveUsers.Count} inactive)");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending reminders");
            }
        }

        /// <summary>
        /// Sends a reminder to a user who hasn't joined the group
        /// </summary>
        private async Task SendNotJoinedReminderAsync(UserModel user)
        {
            try
            {
                string message = $"🌟 *Don't Miss Out!* 🌟\n\n" +
                                 $"You haven't joined our Telegram group yet! " +
                                 $"Join now to earn {_joinReward} Bricks and unlock more rewards.\n\n" +
                                 $"[Join Our Group]({_groupLink})";
                
                await _botClient.SendTextMessageAsync(
                    chatId: user.TelegramId,
                    text: message,
                    parseMode: ParseMode.Markdown,
                    disableWebPagePreview: false);
                
                _logger.LogInformation($"Sent not-joined reminder to user {user.TelegramId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending not-joined reminder to user {user.TelegramId}");
            }
        }

        /// <summary>
        /// Sends a reminder to a user who joined but isn't active
        /// </summary>
        private async Task SendInactiveReminderAsync(UserModel user)
        {
            try
            {
                string message = $"✨ *Get More Rewards!* ✨\n\n" +
                                 $"Thanks for joining our group! Start chatting to earn even more Bricks " +
                                 $"and unlock special rewards!\n\n" +
                                 $"[Go to Group]({_groupLink})";
                
                await _botClient.SendTextMessageAsync(
                    chatId: user.TelegramId,
                    text: message,
                    parseMode: ParseMode.Markdown,
                    disableWebPagePreview: false);
                
                _logger.LogInformation($"Sent inactive reminder to user {user.TelegramId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending inactive reminder to user {user.TelegramId}");
            }
        }
    }
}
