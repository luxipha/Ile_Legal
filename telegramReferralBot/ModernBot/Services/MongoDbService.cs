using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TelegramReferralBot.Models;

namespace TelegramReferralBot.Services
{
    /// <summary>
    /// Service for MongoDB operations
    /// </summary>
    public class MongoDbService
    {
        private readonly IMongoCollection<UserModel> _users;
        private readonly IMongoCollection<ReferralModel> _referrals;
        private readonly IMongoCollection<ActivityModel> _activities;
        private readonly IMongoCollection<RefLinkModel> _refLinks;
        
        /// <summary>
        /// Initializes a new instance of the MongoDbService class
        /// </summary>
        public MongoDbService(string connectionString, string databaseName)
        {
            var client = new MongoClient(connectionString);
            var database = client.GetDatabase(databaseName);
            
            // Use the existing collections from the backend
            _users = database.GetCollection<UserModel>("users");
            _referrals = database.GetCollection<ReferralModel>("referrals");
            _activities = database.GetCollection<ActivityModel>("activities");
            _refLinks = database.GetCollection<RefLinkModel>("reflinks");
            
            Logging.AddToLog($"MongoDB service initialized with backend database: {databaseName}");
            Console.WriteLine($"Connected to backend MongoDB: {databaseName}");
            
            // Ensure indexes for better performance
            CreateIndexesAsync().Wait();
        }
        
        /// <summary>
        /// Creates indexes on frequently queried fields
        /// </summary>
        private async Task CreateIndexesAsync()
        {
            try
            {
                // Create index on telegramChatId for users collection
                var userIndexBuilder = Builders<UserModel>.IndexKeys;
                var userIndexModel = new CreateIndexModel<UserModel>(
                    userIndexBuilder.Ascending(u => u.TelegramId),
                    new CreateIndexOptions { Background = true, Name = "telegramChatId_idx" }
                );
                await _users.Indexes.CreateOneAsync(userIndexModel);
                
                // Create index on referral code
                var refLinkIndexBuilder = Builders<RefLinkModel>.IndexKeys;
                var refLinkIndexModel = new CreateIndexModel<RefLinkModel>(
                    refLinkIndexBuilder.Ascending(r => r.RefCode),
                    new CreateIndexOptions { Background = true, Name = "refCode_idx" }
                );
                await _refLinks.Indexes.CreateOneAsync(refLinkIndexModel);
                
                Logging.AddToLog("MongoDB indexes created successfully");
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error creating MongoDB indexes: {ex.Message}");
                Console.WriteLine($"Error creating MongoDB indexes: {ex.Message}");
            }
        }
        
        /// <summary>
        /// Tests the MongoDB connection by attempting to count documents
        /// </summary>
        /// <returns>True if connection is successful, false otherwise</returns>
        public async Task<bool> TestConnectionAsync()
        {
            try
            {
                // Try to count users as a simple connection test
                await _users.CountDocumentsAsync(Builders<UserModel>.Filter.Empty);
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"MongoDB connection test failed: {ex.Message}");
                return false;
            }
        }
        
        #region User Operations
        
        /// <summary>
        /// Gets a user by their Telegram ID
        /// </summary>
        public async Task<UserModel?> GetUserAsync(string telegramId)
        {
            try
            {
                // In the backend schema, telegramId is stored as telegramChatId
                var filter = Builders<UserModel>.Filter.Eq(u => u.TelegramId, telegramId);
                return await _users.Find(filter).FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error getting user: {ex.Message}");
                Console.WriteLine($"Error getting user: {ex.Message}");
                return new UserModel();
            }
        }
        
        /// <summary>
        /// Creates a new user or updates an existing one
        /// </summary>
        public async Task<string?> CreateUserAsync(UserModel user)
        {
            try
            {
                // Check if user already exists by telegramChatId
                var filter = Builders<UserModel>.Filter.Eq(u => u.TelegramId, user.TelegramId);
                var existingUser = await _users.Find(filter).FirstOrDefaultAsync();
                
                if (existingUser != null)
                {
                    // Update existing user
                    user.Id = existingUser.Id;
                    user.Email = existingUser.Email; // Preserve email if exists
                    user.Balance = existingUser.Balance; // Preserve balance
                    user.UpdatedAt = DateTime.UtcNow;
                    
                    await _users.ReplaceOneAsync(filter, user);
                    Logging.AddToLog($"Updated existing user with telegramChatId: {user.TelegramId}");
                    return user.Id;
                }
                else
                {
                    // Create new user
                    user.CreatedAt = DateTime.UtcNow;
                    user.UpdatedAt = DateTime.UtcNow;
                    
                    // Set default values for backend schema
                    user.Balance = user.BricksTotal; // Use bricks as initial balance
                    
                    await _users.InsertOneAsync(user);
                    Logging.AddToLog($"Created new user with telegramChatId: {user.TelegramId}");
                    return user.Id;
                }
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error creating/updating user: {ex.Message}");
                Console.WriteLine($"Error creating/updating user: {ex.Message}");
                return null;
            }
        }
        
        /// <summary>
        /// Updates an existing user
        /// </summary>
        public async Task<bool> UpdateUserAsync(UserModel user)
        {
            try
            {
                // Use telegramChatId as the primary filter for updates
                var filter = Builders<UserModel>.Filter.Eq(u => u.TelegramId, user.TelegramId);
                
                // Get existing user to preserve fields we don't want to overwrite
                var existingUser = await _users.Find(filter).FirstOrDefaultAsync();
                if (existingUser != null)
                {
                    // Preserve fields from backend that we don't want to change
                    user.Id = existingUser.Id;
                    user.Email = existingUser.Email;
                    
                    // Preserve existing referrals and add new ones if needed
                    if (existingUser.Referrals != null && existingUser.Referrals.Count > 0)
                    {
                        // Start with existing referrals
                        user.Referrals = existingUser.Referrals;
                    }
                    
                    // Sync bricks total with balance for consistency
                    user.Balance = user.BricksTotal;
                    
                    // Update timestamp
                    user.UpdatedAt = DateTime.UtcNow;
                    
                    // Replace the document
                    await _users.ReplaceOneAsync(filter, user);
                    Logging.AddToLog($"Updated user with telegramChatId: {user.TelegramId}");
                    return true;
                }
                else
                {
                    // User not found, create a new one
                    user.CreatedAt = DateTime.UtcNow;
                    user.UpdatedAt = DateTime.UtcNow;
                    user.Balance = user.BricksTotal;
                    
                    await _users.InsertOneAsync(user);
                    Logging.AddToLog($"Created new user during update with telegramChatId: {user.TelegramId}");
                    return true;
                }
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error updating user: {ex.Message}");
                Console.WriteLine($"Error updating user: {ex.Message}");
                return false;
            }
        }
        
        /// <summary>
        /// Adds a referral to a user's referrals array
        /// </summary>
        public async Task<bool> AddReferralToUserAsync(string referrerId, string referredId, string referredName, int points)
        {
            try
            {
                var filter = Builders<UserModel>.Filter.Eq(u => u.TelegramId, referrerId);
                var user = await _users.Find(filter).FirstOrDefaultAsync();
                
                if (user == null)
                {
                    Logging.AddToLog($"User {referrerId} not found for adding referral");
                    return false;
                }
                
                // Create new referral entry
                var referral = new ReferralEntryModel
                {
                    Name = referredName,
                    Status = "joined",
                    JoinedAt = DateTime.UtcNow,
                    BricksEarned = points
                };
                
                // Add to user's referrals array
                var update = Builders<UserModel>.Update
                    .Push(u => u.Referrals, referral)
                    .Set(u => u.UpdatedAt, DateTime.UtcNow)
                    .Inc("bricks.total", points)
                    .Inc(u => u.Balance, points);
                
                var result = await _users.UpdateOneAsync(filter, update);
                
                if (result.ModifiedCount > 0)
                {
                    Logging.AddToLog($"Added referral {referredId} to user {referrerId}");
                    return true;
                }
                else
                {
                    Logging.AddToLog($"Failed to add referral {referredId} to user {referrerId}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error adding referral to user: {ex.Message}");
                Console.WriteLine($"Error adding referral to user: {ex.Message}");
                return false;
            }
        }
        
        /// <summary>
        /// Updates a user's bricks total
        /// </summary>
        public async Task<bool> UpdateUserBricksAsync(string userId, int bricksTotal)
        {
            try
            {
                var filter = Builders<UserModel>.Filter.Eq(u => u.TelegramId, userId);
                var update = Builders<UserModel>.Update
                    .Set("bricks.total", bricksTotal)
                    .Set(u => u.Balance, bricksTotal)
                    .Set(u => u.UpdatedAt, DateTime.UtcNow);
                
                var result = await _users.UpdateOneAsync(filter, update);
                
                if (result.ModifiedCount > 0)
                {
                    Logging.AddToLog($"Updated bricks total for user {userId} to {bricksTotal}");
                    return true;
                }
                else
                {
                    Logging.AddToLog($"Failed to update bricks total for user {userId}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error updating user bricks: {ex.Message}");
                Console.WriteLine($"Error updating user bricks: {ex.Message}");
                return false;
            }
        }
        
        /// <summary>
        /// Gets all users
        /// </summary>
        public async Task<List<UserModel>> GetAllUsersAsync()
        {
            try
            {
                return await _users.Find(_ => true).ToListAsync();
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error getting all users: {ex.Message}");
                Console.WriteLine($"Error getting all users: {ex.Message}");
                return new List<UserModel>();
            }
        }
        
        /// <summary>
        /// Updates user password attempts
        /// </summary>
        public async Task<bool> UpdatePasswordAttemptsAsync(string telegramId, int attempts)
        {
            try
            {
                var filter = Builders<UserModel>.Filter.Eq(u => u.TelegramId, telegramId);
                var update = Builders<UserModel>.Update
                    .Set(u => u.PasswordAttempts, attempts)
                    .Set(u => u.UpdatedAt, DateTime.UtcNow);
                
                var result = await _users.UpdateOneAsync(filter, update);
                return result.IsAcknowledged && result.ModifiedCount > 0;
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error updating password attempts: {ex.Message}");
                Console.WriteLine($"Error updating password attempts: {ex.Message}");
                return false;
            }
        }
        
        /// <summary>
        /// Sets a user as admin
        /// </summary>
        public async Task<bool> SetUserAsAdminAsync(string telegramId)
        {
            try
            {
                var filter = Builders<UserModel>.Filter.Eq(u => u.TelegramId, telegramId);
                var update = Builders<UserModel>.Update
                    .Set(u => u.IsAdmin, true)
                    .Set(u => u.UpdatedAt, DateTime.UtcNow);
                
                var result = await _users.UpdateOneAsync(filter, update);
                return result.IsAcknowledged && result.ModifiedCount > 0;
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error setting user as admin: {ex.Message}");
                Console.WriteLine($"Error setting user as admin: {ex.Message}");
                return false;
            }
        }
        
        /// <summary>
        /// Bans a user
        /// </summary>
        public async Task<bool> BanUserAsync(string telegramId)
        {
            try
            {
                var filter = Builders<UserModel>.Filter.Eq(u => u.TelegramId, telegramId);
                var update = Builders<UserModel>.Update
                    .Set(u => u.IsBanned, true)
                    .Set(u => u.UpdatedAt, DateTime.UtcNow);
                
                var result = await _users.UpdateOneAsync(filter, update);
                return result.IsAcknowledged && result.ModifiedCount > 0;
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error banning user: {ex.Message}");
                Console.WriteLine($"Error banning user: {ex.Message}");
                return false;
            }
        }
        
        /// <summary>
        /// Unbans a user
        /// </summary>
        public async Task<bool> UnbanUserAsync(string telegramId)
        {
            try
            {
                var filter = Builders<UserModel>.Filter.Eq(u => u.TelegramId, telegramId);
                var update = Builders<UserModel>.Update
                    .Set(u => u.IsBanned, false)
                    .Set(u => u.UpdatedAt, DateTime.UtcNow);
                
                var result = await _users.UpdateOneAsync(filter, update);
                return result.IsAcknowledged && result.ModifiedCount > 0;
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error unbanning user: {ex.Message}");
                Console.WriteLine($"Error unbanning user: {ex.Message}");
                return false;
            }
        }
        
        /// <summary>
        /// Updates show welcome flag for a user
        /// </summary>
        public async Task<bool> UpdateShowWelcomeAsync(string telegramId, bool showWelcome)
        {
            try
            {
                var filter = Builders<UserModel>.Filter.Eq(u => u.TelegramId, telegramId);
                var update = Builders<UserModel>.Update
                    .Set(u => u.ShowWelcome, showWelcome)
                    .Set(u => u.UpdatedAt, DateTime.UtcNow);
                
                var result = await _users.UpdateOneAsync(filter, update);
                return result.IsAcknowledged && result.ModifiedCount > 0;
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error updating show welcome: {ex.Message}");
                Console.WriteLine($"Error updating show welcome: {ex.Message}");
                return false;
            }
        }
        
        #endregion
        
        #region Referral Operations
        
        /// <summary>
        /// Gets a referral by referred ID
        /// </summary>
        public async Task<ReferralModel?> GetReferralByReferredIdAsync(string referredId)
        {
            try
            {
                var filter = Builders<ReferralModel>.Filter.Eq(r => r.ReferredId, referredId) &
                             Builders<ReferralModel>.Filter.Eq(r => r.Type, "referral");
                return await _referrals.Find(filter).FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error getting referral: {ex.Message}");
                Console.WriteLine($"Error getting referral: {ex.Message}");
                return new ReferralModel();
            }
        }
        
        /// <summary>
        /// Creates a new referral
        /// </summary>
        public async Task<ReferralModel> CreateReferralAsync(ReferralModel referral)
        {
            try
            {
                referral.Timestamp = DateTime.UtcNow;
                await _referrals.InsertOneAsync(referral);
                return referral;
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error creating referral: {ex.Message}");
                Console.WriteLine($"Error creating referral: {ex.Message}");
                return new ReferralModel();
            }
        }
        
        /// <summary>
        /// Gets all referrals for a referrer
        /// </summary>
        public async Task<List<ReferralModel>> GetReferralsByReferrerIdAsync(string referrerId)
        {
            try
            {
                var filter = Builders<ReferralModel>.Filter.Eq(r => r.ReferrerId, referrerId) &
                             Builders<ReferralModel>.Filter.Eq(r => r.Type, "referral");
                return await _referrals.Find(filter).ToListAsync();
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error getting referrals: {ex.Message}");
                Console.WriteLine($"Error getting referrals: {ex.Message}");
                return new List<ReferralModel>();
            }
        }
        
        /// <summary>
        /// Gets all referrals
        /// </summary>
        public async Task<List<ReferralModel>> GetAllReferralsAsync()
        {
            try
            {
                var filter = Builders<ReferralModel>.Filter.Eq(r => r.Type, "referral");
                return await _referrals.Find(filter).ToListAsync();
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error getting all referrals: {ex.Message}");
                Console.WriteLine($"Error getting all referrals: {ex.Message}");
                return new List<ReferralModel>();
            }
        }
        
        /// <summary>
        /// Gets referral count by day
        /// </summary>
        public async Task<Dictionary<string, int>> GetReferralCountByDayAsync()
        {
            try
            {
                var referrals = await _referrals.Find(r => r.Type == "referral").ToListAsync();
                var result = new Dictionary<string, int>();
                
                foreach (var referral in referrals)
                {
                    string day = referral.Timestamp.ToString("MM/dd/yyyy");
                    if (result.ContainsKey(day))
                    {
                        result[day]++;
                    }
                    else
                    {
                        result[day] = 1;
                    }
                }
                
                return result;
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error getting referral count by day: {ex.Message}");
                Console.WriteLine($"Error getting referral count by day: {ex.Message}");
                return new Dictionary<string, int>();
            }
        }
        
        /// <summary>
        /// Gets the count of referrals by referrer ID
        /// </summary>
        public async Task<int> GetReferralCountByReferrerIdAsync(string referrerId)
        {
            try
            {
                var filter = Builders<ReferralModel>.Filter.Eq(r => r.ReferrerId, referrerId);
                return (int)await _referrals.CountDocumentsAsync(filter);
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error getting referral count by referrer ID: {ex.Message}");
                return 0;
            }
        }
        
        #endregion
        
        #region Activity Operations
        
        /// <summary>
        /// Gets user activity for a specific day
        /// </summary>
        public async Task<ActivityModel> GetUserActivityAsync(string userId, string date)
        {
            try
            {
                var filter = Builders<ActivityModel>.Filter.Eq(a => a.UserId, userId) &
                             Builders<ActivityModel>.Filter.Eq(a => a.Date, date);
                return await _activities.Find(filter).FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error getting user activity: {ex.Message}");
                Console.WriteLine($"Error getting user activity: {ex.Message}");
                return new ActivityModel();
            }
        }
        
        /// <summary>
        /// Creates or updates user activity
        /// </summary>
        public async Task<bool> UpsertUserActivityAsync(string userId, string date, int points)
        {
            try
            {
                var filter = Builders<ActivityModel>.Filter.And(
                    Builders<ActivityModel>.Filter.Eq(a => a.UserId, userId),
                    Builders<ActivityModel>.Filter.Eq(a => a.Date, date)
                );
                
                var activity = await _activities.Find(filter).FirstOrDefaultAsync();
                
                if (activity == null)
                {
                    // Create new activity
                    activity = new ActivityModel
                    {
                        UserId = userId,
                        Date = date,
                        Points = points,
                        Timestamp = DateTime.UtcNow
                    };
                    
                    await _activities.InsertOneAsync(activity);
                    return true;
                }
                else
                {
                    // Update existing activity
                    var update = Builders<ActivityModel>.Update
                        .Set(a => a.Points, points)
                        .Set(a => a.Timestamp, DateTime.UtcNow);
                    
                    var result = await _activities.UpdateOneAsync(filter, update);
                    return result.IsAcknowledged && result.ModifiedCount > 0;
                }
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error upserting user activity: {ex.Message}");
                Console.WriteLine($"Error upserting user activity: {ex.Message}");
                return false;
            }
        }
        
        /// <summary>
        /// Gets all activities for a user
        /// </summary>
        public async Task<Dictionary<string, int>> GetAllUserActivitiesAsync(string userId)
        {
            try
            {
                var filter = Builders<ActivityModel>.Filter.Eq(a => a.UserId, userId);
                var activities = await _activities.Find(filter).ToListAsync();
                
                var result = new Dictionary<string, int>();
                foreach (var activity in activities)
                {
                    if (activity.Date != null)
                    {
                        result[activity.Date] = activity.Points;
                    }
                }
                
                return result;
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error getting all user activities: {ex.Message}");
                Console.WriteLine($"Error getting all user activities: {ex.Message}");
                return new Dictionary<string, int>();
            }
        }
        
        #endregion
        
        #region RefLink Operations
        
        /// <summary>
        /// Gets a referral link by user ID
        /// </summary>
        public async Task<RefLinkModel?> GetRefLinkByUserIdAsync(string userId)
        {
            try
            {
                var filter = Builders<RefLinkModel>.Filter.Eq(r => r.UserId, userId);
                return await _refLinks.Find(filter).FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error getting ref link by user ID: {ex.Message}");
                Console.WriteLine($"Error getting ref link by user ID: {ex.Message}");
                return new RefLinkModel();
            }
        }
        
        /// <summary>
        /// Gets a referral link by referral code
        /// </summary>
        public async Task<RefLinkModel?> GetRefLinkByCodeAsync(string refCode)
        {
            try
            {
                var filter = Builders<RefLinkModel>.Filter.Eq(r => r.RefCode, refCode);
                return await _refLinks.Find(filter).FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error getting ref link by code: {ex.Message}");
                Console.WriteLine($"Error getting ref link by code: {ex.Message}");
                return new RefLinkModel();
            }
        }
        
        /// <summary>
        /// Gets a user ID by referral code
        /// </summary>
        public async Task<string?> GetUserIdByRefCodeAsync(string refCode)
        {
            try
            {
                var filter = Builders<RefLinkModel>.Filter.Eq(r => r.RefCode, refCode);
                var refLink = await _refLinks.Find(filter).FirstOrDefaultAsync();
                return refLink?.UserId;
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error getting user ID by ref code: {ex.Message}");
                Console.WriteLine($"Error getting user ID by ref code: {ex.Message}");
                return null;
            }
        }
        
        /// <summary>
        /// Creates a new referral link
        /// </summary>
        public async Task<RefLinkModel> CreateRefLinkAsync(RefLinkModel refLink)
        {
            try
            {
                refLink.CreatedAt = DateTime.UtcNow;
                await _refLinks.InsertOneAsync(refLink);
                return refLink;
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error creating ref link: {ex.Message}");
                Console.WriteLine($"Error creating ref link: {ex.Message}");
                return new RefLinkModel();
            }
        }
        
        /// <summary>
        /// Gets all referral links
        /// </summary>
        public async Task<Dictionary<string, string>> GetAllRefLinksAsync()
        {
            try
            {
                var refLinks = await _refLinks.Find(_ => true).ToListAsync();
                
                var result = new Dictionary<string, string>();
                foreach (var refLink in refLinks)
                {
                    if (refLink.UserId != null && refLink.RefCode != null)
                    {
                        result[refLink.UserId] = refLink.RefCode;
                    }
                }
                
                return result;
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error getting all ref links: {ex.Message}");
                Console.WriteLine($"Error getting all ref links: {ex.Message}");
                return new Dictionary<string, string>();
            }
        }
        
        #endregion
        
        #region Points Operations
        
        /// <summary>
        /// Calculates total points for a user
        /// </summary>
        public async Task<int> CalculateUserPointsAsync(string userId)
        {
            try
            {
                int total = 0;
                
                // Get referral points (user as referrer)
                var referrals = await GetReferralsByReferrerIdAsync(userId);
                foreach (var referral in referrals)
                {
                    total += referral.Points;
                }
                
                // Get activity points
                var activities = await GetAllUserActivitiesAsync(userId);
                foreach (var activity in activities.Values)
                {
                    total += activity;
                }
                
                return total;
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error calculating user points: {ex.Message}");
                return 0;
            }
        }
        
        /// <summary>
        /// Gets top users by points
        /// </summary>
        public async Task<List<UserModel>> GetTopUsersByPointsAsync(int limit = 10)
        {
            try
            {
                var users = await GetAllUsersAsync();
                var userPoints = new Dictionary<string, int>();
                
                foreach (var user in users)
                {
                    int points = await CalculateUserPointsAsync(user.TelegramId);
                    userPoints[user.TelegramId] = points;
                }
                
                // Sort users by points
                users.Sort((a, b) => userPoints.GetValueOrDefault(b.TelegramId, 0).CompareTo(userPoints.GetValueOrDefault(a.TelegramId, 0)));
                
                // Take top users
                return users.Take(limit).ToList();
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"Error getting top users: {ex.Message}");
                return new List<UserModel>();
            }
        }
        
        #endregion
    }
}
