using System;
using System.Threading;
using System.Threading.Tasks;
using Telegram.Bot;
using Telegram.Bot.Types;
using TelegramReferralBot.Services;
using TelegramReferralBot.Utils;
using TelegramReferralBot.Models;

namespace TelegramReferralBot.Handlers
{
    public class GroupHandler
    {
        private readonly ITelegramBotClient _botClient;
        private readonly MongoDbService _mongoDb;
        private readonly PointsService _pointsService;
        private readonly ReferralService _referralService;
        private readonly IBotLogger _logger;

        public GroupHandler(
            ITelegramBotClient botClient,
            MongoDbService mongoDb,
            PointsService pointsService,
            ReferralService referralService,
            ILogger logger)
        {
            _botClient = botClient;
            _mongoDb = mongoDb;
            _pointsService = pointsService;
            _referralService = referralService;
            _logger = new LoggerAdapter(logger);
        }

        /// <summary>
        /// Handles new members joining the group
        /// </summary>
        public async Task HandleNewMembersAsync(Message message, CancellationToken cancellationToken)
        {
            Console.WriteLine($"[DEBUG] GROUP: New members detected in chat {message.Chat.Id} ({message.Chat.Title})");
            Console.WriteLine($"[DEBUG] GROUP: Number of new members: {message.NewChatMembers.Length}");
            
            foreach (var newMember in message.NewChatMembers)
            {
                if (newMember.IsBot)
                {
                    Console.WriteLine($"[DEBUG] GROUP: Skipping bot member: {newMember.Id} ({newMember.Username})");
                    continue;
                }

                string newUserId = newMember.Id.ToString();
                Console.WriteLine($"[DEBUG] GROUP: Processing new member: {newUserId} ({newMember.Username ?? newMember.FirstName})");
                
                try
                {
                    // Check if user exists
                    Console.WriteLine($"[DEBUG] GROUP: Checking if user {newUserId} exists in database");
                    Console.WriteLine($"[DEBUG] DB REQUEST: GetUserAsync({newUserId})");
                    var user = await _mongoDb.GetUserAsync(newUserId);
                    
                    if (user == null)
                    {
                        Console.WriteLine($"[DEBUG] DB RESPONSE: User {newUserId} not found in database");
                        Console.WriteLine($"[DEBUG] GROUP: Will create new user and award join bonus");
                        // Create new user with join bonus
                        var newUser = new UserModel
                        {
                            TelegramId = newUserId,
                            Username = newMember.Username,
                            FirstName = newMember.FirstName,
                            LastName = newMember.LastName,
                            Email = $"telegram_{newUserId}@placeholder.ile",
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };
                        await _mongoDb.CreateUserAsync(newUser);

                        // Award join bonus
                        await _pointsService.AwardJoinBonusAsync(newUserId);
                        
                        // Send welcome message
                        await SendWelcomeMessageAsync(message.Chat.Id, newMember, cancellationToken);
                    }

                    // Check for completed referrals for this user (for logging purposes only)
                    Console.WriteLine($"[DEBUG] GROUP: Checking for completed referrals for user {newUserId}");
                    
                    // We only check for completed referrals since all referrals are now marked as completed immediately
                    // when a user clicks a referral link. This prevents double-awarding of points.
                    var completedReferrals = await _mongoDb.GetCompletedReferralsForUserAsync(newUserId);
                    
                    if (completedReferrals != null && completedReferrals.Count > 0)
                    {
                        Console.WriteLine($"[DEBUG] GROUP: User {newUserId} has {completedReferrals.Count} completed referrals");
                        foreach (var referral in completedReferrals)
                        {
                            Console.WriteLine($"[DEBUG] GROUP: Referral from {referral.ReferrerId} to {referral.ReferredId}, status: {referral.Status}");
                        }
                    }
                    else
                    {
                        Console.WriteLine($"[DEBUG] GROUP: No referrals found for user {newUserId}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.Log($"Error handling new member {newUserId}: {ex.Message}");
                }
            }
        }

        /// <summary>
        /// Handles messages in the group
        /// </summary>
        public async Task HandleGroupMessageAsync(Message message, CancellationToken cancellationToken)
        {
            // Log detailed group information
            long groupId = message.Chat.Id;
            string groupTitle = message.Chat.Title;
            string groupType = message.Chat.Type.ToString();
            
            Console.WriteLine($"[DEBUG] GROUP HANDLER: Processing message in group {groupId} ({groupTitle})");
            
            // Query the database for group information
            await _mongoDb.CheckGroupExistsAsync(groupId);
            
            // Handle new members joining the group
            if (message.NewChatMembers != null && message.NewChatMembers.Length > 0)
            {
                Console.WriteLine($"[DEBUG] GROUP HANDLER: Detected {message.NewChatMembers.Length} new members in group {groupId}");
                await HandleNewMembersAsync(message, cancellationToken);
                return;
            }

            // Handle regular group messages
            string userId = message.From.Id.ToString();
            Console.WriteLine($"[DEBUG] GROUP HANDLER: Processing regular message from user {userId} in group {groupId}");
            await UpdateUserActivityAsync(userId, message.Chat.Id);
        }

        private async Task UpdateUserActivityAsync(string userId, long chatId)
        {
            try
            {
                Console.WriteLine($"[DEBUG] GROUP ACTIVITY: Processing activity for user {userId} in group {chatId}");
                
                // First check if user exists in the database
                Console.WriteLine($"[DEBUG] DB REQUEST: Checking if user {userId} exists");
                var user = await _mongoDb.GetUserAsync(userId);
                
                if (user == null)
                {
                    Console.WriteLine($"[DEBUG] DB RESPONSE: User {userId} not found in database");
                    Console.WriteLine($"[DEBUG] GROUP ACTIVITY: Creating new user for {userId}");
                    
                    // Create a new user since they don't exist yet
                    var newUser = new UserModel
                    {
                        TelegramId = userId,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        Bricks = new BricksModel { Total = 0 },
                        Balance = 0,
                        // Add a unique email placeholder to avoid duplicate key errors
                        Email = $"telegram_{userId}@placeholder.ile"
                    };
                    
                    await _mongoDb.CreateUserAsync(newUser);
                    Console.WriteLine($"[DEBUG] DB RESPONSE: Created new user {userId}");
                }
                else
                {
                    Console.WriteLine($"[DEBUG] DB RESPONSE: User {userId} found with {user.BricksTotal} Bricks");
                }
                
                // Create activity record
                var activity = new ActivityModel
                {
                    UserId = userId,
                    Type = "message",
                    Points = Config.MessageReward,
                    Timestamp = DateTime.UtcNow,
                    Date = DateTime.UtcNow.ToString("yyyy-MM-dd") // Set the date explicitly
                };

                // Check daily points limit
                Console.WriteLine($"[DEBUG] GROUP ACTIVITY: Checking daily points limit for user {userId}");
                int todayPoints = await _mongoDb.GetTodayPointsAsync(userId);
                Console.WriteLine($"[DEBUG] GROUP ACTIVITY: User {userId} has earned {todayPoints} points today, limit is {Config.MaxPointsPerDay}");
                
                if (todayPoints < Config.MaxPointsPerDay)
                {
                    Console.WriteLine($"[DEBUG] GROUP ACTIVITY: User {userId} is under daily limit, awarding points");
                    await _mongoDb.CreateActivityAsync(activity);
                    await _pointsService.AwardPointsAsync(userId, Config.MessageReward, "being active in the group");
                }
                else
                {
                    Console.WriteLine($"[DEBUG] GROUP ACTIVITY: User {userId} has reached daily limit of {Config.MaxPointsPerDay} points");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] GROUP ACTIVITY ERROR: {ex.Message}");
                _logger.Log($"Error updating user activity: {ex.Message}");
            }
        }

        private async Task SendWelcomeMessageAsync(long chatId, User newMember, CancellationToken cancellationToken)
        {
            string welcomeMessage = $"Welcome {newMember.FirstName} to Ilé! 🎉\n\n" +
                                  $"You've earned {Config.JoinReward} Bricks for joining!\n" +
                                  "Start earning more by being active and referring friends.";

            await _botClient.SendTextMessageAsync(
                chatId: chatId,
                text: welcomeMessage,
                cancellationToken: cancellationToken
            );
        }
    }
}
