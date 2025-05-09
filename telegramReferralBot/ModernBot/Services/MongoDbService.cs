using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.Extensions.Logging;
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
        private readonly ILogger<MongoDbService> _logger;
        
        /// <summary>
        /// Initializes a new instance of the MongoDbService class
        /// </summary>
        public MongoDbService(string connectionString, string databaseName, ILogger<MongoDbService> logger)
        {
            try
            {
                _logger = logger;
                
                Console.WriteLine($"[MONGODB] Attempting to connect to MongoDB: {databaseName}");
                _logger.LogInformation($"Attempting to connect to MongoDB: {databaseName}");
                
                // Create client with connection string
                var client = new MongoClient(connectionString);
                
                // Test connection by listing databases
                var dbList = client.ListDatabases().ToList();
                Console.WriteLine($"[MONGODB] Successfully connected to MongoDB. Available databases: {dbList.Count}");
                
                // Get database
                var database = client.GetDatabase(databaseName);
                
                // Use the existing collections from the backend
                _users = database.GetCollection<UserModel>("users");
                _referrals = database.GetCollection<ReferralModel>("referrals");
                _activities = database.GetCollection<ActivityModel>("activities");
                _refLinks = database.GetCollection<RefLinkModel>("reflinks");
                
                // Verify collections exist and are accessible
                var userCount = _users.CountDocuments(FilterDefinition<UserModel>.Empty);
                var referralCount = _referrals.CountDocuments(FilterDefinition<ReferralModel>.Empty);
                var activityCount = _activities.CountDocuments(FilterDefinition<ActivityModel>.Empty);
                var refLinkCount = _refLinks.CountDocuments(FilterDefinition<RefLinkModel>.Empty);
                
                Console.WriteLine($"[MONGODB] Collection counts - Users: {userCount}, Referrals: {referralCount}, Activities: {activityCount}, RefLinks: {refLinkCount}");
                _logger.LogInformation($"MongoDB service initialized with backend database: {databaseName}");
                _logger.LogInformation($"Collection counts - Users: {userCount}, Referrals: {referralCount}, Activities: {activityCount}, RefLinks: {refLinkCount}");
                
                // Ensure indexes for better performance
                CreateIndexesAsync().Wait();
                
                Console.WriteLine($"[MONGODB] Successfully initialized MongoDB service with database: {databaseName}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[MONGODB] ERROR connecting to MongoDB: {ex.Message}");
                _logger.LogError($"Error initializing MongoDB service: {ex.Message}");
                throw; // Re-throw to ensure the application fails if MongoDB is unavailable
            }
        }
        
        /// <summary>
        /// Creates indexes on frequently queried fields
        /// </summary>
        public async Task InitializeAsync()
        {
            await CreateIndexesAsync();
        }
        
        /// <summary>
        /// Gets a generic collection for querying
        /// </summary>
        public IMongoCollection<MongoDB.Bson.BsonDocument> GetCollection(string collectionName)
        {
            try
            {
                Console.WriteLine($"[DEBUG] DB REQUEST: Getting collection {collectionName}");
                var database = _users.Database;
                return database.GetCollection<MongoDB.Bson.BsonDocument>(collectionName);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] DB ERROR: Failed to get collection {collectionName}: {ex.Message}");
                throw;
            }
        }
        
        /// <summary>
        /// Checks if a group exists in the database and logs information about it
        /// </summary>
        public async Task CheckGroupExistsAsync(long groupId)
        {
            try
            {
                Console.WriteLine($"[DEBUG] DB REQUEST: Checking if group {groupId} exists");
                var database = _users.Database;
                var collection = database.GetCollection<MongoDB.Bson.BsonDocument>("groups");
                
                var filter = Builders<MongoDB.Bson.BsonDocument>.Filter.Eq("groupId", groupId.ToString());
                var cursor = await collection.FindAsync(filter);
                var groups = await cursor.ToListAsync();
                
                if (groups.Count > 0)
                {
                    Console.WriteLine($"[DEBUG] DB RESPONSE: Found {groups.Count} records for group {groupId}");
                    foreach (var group in groups)
                    {
                        Console.WriteLine($"[DEBUG] DB GROUP INFO: {group.ToString()}");
                    }
                }
                else
                {
                    Console.WriteLine($"[DEBUG] DB RESPONSE: No records found for group {groupId}, this may be a new group");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] DB ERROR: Failed to check group existence: {ex.Message}");
            }
        }

        /// <summary>
        /// Gets a pending referral for a referred user
        /// </summary>
        public async Task<ReferralModel> GetPendingReferralAsync(string referredId)
        {
            Console.WriteLine($"[DEBUG] DB REQUEST: GetPendingReferralAsync({referredId})");
            var filter = Builders<ReferralModel>.Filter.And(
                Builders<ReferralModel>.Filter.Eq(r => r.ReferredId, referredId),
                Builders<ReferralModel>.Filter.Eq(r => r.Status, "pending")
            );
            var result = await _referrals.Find(filter).FirstOrDefaultAsync();
            Console.WriteLine($"[DEBUG] DB RESPONSE: GetPendingReferralAsync result: {(result != null ? $"Found referral from {result.ReferrerId}" : "No pending referral found")}");
            return result;
        }
        
        /// <summary>
        /// Gets a referral between two users regardless of status
        /// </summary>
        public async Task<ReferralModel> GetReferralByUserIdsAsync(string referrerId, string referredId)
        {
            try
            {
                Console.WriteLine($"[DEBUG] DB REQUEST: GetReferralByUserIdsAsync({referrerId}, {referredId})");
                var filter = Builders<ReferralModel>.Filter.And(
                    Builders<ReferralModel>.Filter.Eq(r => r.ReferrerId, referrerId),
                    Builders<ReferralModel>.Filter.Eq(r => r.ReferredId, referredId)
                );
                var result = await _referrals.Find(filter).FirstOrDefaultAsync();
                Console.WriteLine($"[DEBUG] DB RESPONSE: GetReferralByUserIdsAsync result: {(result != null ? $"Found referral with status {result.Status}" : "No referral found")}");
                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] DB ERROR: Error in GetReferralByUserIdsAsync: {ex.Message}");
                return null;
            }
        }
        
        /// <summary>
        /// Gets all completed referrals for a user (either as referrer or referred)
        /// </summary>
        public async Task<List<ReferralModel>> GetCompletedReferralsForUserAsync(string userId)
        {
            try
            {
                Console.WriteLine($"[DEBUG] DB REQUEST: GetCompletedReferralsForUserAsync({userId})");
                var filter = Builders<ReferralModel>.Filter.And(
                    Builders<ReferralModel>.Filter.Or(
                        Builders<ReferralModel>.Filter.Eq(r => r.ReferrerId, userId),
                        Builders<ReferralModel>.Filter.Eq(r => r.ReferredId, userId)
                    ),
                    Builders<ReferralModel>.Filter.Eq(r => r.Status, "completed")
                );
                var results = await _referrals.Find(filter).ToListAsync();
                Console.WriteLine($"[DEBUG] DB RESPONSE: GetCompletedReferralsForUserAsync found {results.Count} completed referrals for user {userId}");
                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] DB ERROR: Error in GetCompletedReferralsForUserAsync: {ex.Message}");
                return new List<ReferralModel>();
            }
        }

        /// <summary>
        /// Updates the status of a referral
        /// </summary>
        public async Task UpdateReferralStatusAsync(string referralId, string status)
        {
            try
            {
                Console.WriteLine($"[DEBUG] DB REQUEST: UpdateReferralStatusAsync({referralId}, {status})");
                var filter = Builders<ReferralModel>.Filter.Eq(r => r.Id, referralId);
                var update = Builders<ReferralModel>.Update.Set(r => r.Status, status);
                var result = await _referrals.UpdateOneAsync(filter, update);
                Console.WriteLine($"[DEBUG] DB RESPONSE: UpdateReferralStatusAsync result: {(result.ModifiedCount > 0 ? "Success" : "No changes")}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] DB ERROR: Error in UpdateReferralStatusAsync: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Marks a referral as completed
        /// </summary>
        public async Task MarkReferralCompletedAsync(string referralId)
        {
            await UpdateReferralStatusAsync(referralId, "completed");
        }

        public async Task<int> GetTodayPointsAsync(string userId)
        {
            try
            {
                // Get max points per day from environment variable directly
                int maxPointsPerDay = 20; // Default value
                string maxPointsStr = Environment.GetEnvironmentVariable("MAX_POINTS_PER_DAY");
                if (!string.IsNullOrEmpty(maxPointsStr) && int.TryParse(maxPointsStr, out int envMaxPoints))
                {
                    maxPointsPerDay = envMaxPoints;
                }
                
                Console.WriteLine($"[MONGODB] Calculating today's points for user {userId}, max allowed: {maxPointsPerDay}");
                _logger.LogInformation($"Calculating today's points for user {userId}, max allowed: {maxPointsPerDay}");
                
                // Verify MongoDB connection before proceeding
                if (!await TestConnectionAsync())
                {
                    Console.WriteLine($"[MONGODB] ERROR: Database connection failed when trying to get today's points for user {userId}");
                    _logger.LogError($"Database connection failed when trying to get today's points for user {userId}");
                    return 0;
                }
                
                var today = DateTime.UtcNow.Date;
                Console.WriteLine($"[MONGODB] Checking activities for user {userId} since {today} (UTC)");
                
                var filter = Builders<ActivityModel>.Filter.And(
                    Builders<ActivityModel>.Filter.Eq(a => a.UserId, userId),
                    Builders<ActivityModel>.Filter.Gte(a => a.CreatedAt, today)
                );
                
                try
                {
                    var activities = await _activities.Find(filter).ToListAsync();
                    Console.WriteLine($"[MONGODB] Found {activities.Count} activities for user {userId} today");
                    
                    // List all activities for debugging
                    foreach (var activity in activities)
                    {
                        Console.WriteLine($"[MONGODB] Activity: {activity.Type}, Points: {activity.Points}, Time: {activity.CreatedAt}");
                    }
                    
                    int totalPoints = activities.Sum(a => a.Points);
                    Console.WriteLine($"[MONGODB] User {userId} has earned {totalPoints} points today out of {maxPointsPerDay} max");
                    _logger.LogInformation($"User {userId} has earned {totalPoints} points today out of {maxPointsPerDay} max");
                    
                    return totalPoints;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[MONGODB] ERROR querying activities: {ex.Message}");
                    _logger.LogError($"Error querying activities: {ex.Message}");
                    return 0;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[MONGODB] EXCEPTION in GetTodayPointsAsync: {ex.Message}");
                _logger.LogError($"Exception in GetTodayPointsAsync: {ex.Message}");
                return 0; // Return 0 instead of throwing an exception
            }
        }

        public async Task CreateActivityAsync(ActivityModel activity)
        {
            try
            {
                // Set date field if not already set
                if (string.IsNullOrEmpty(activity.Date))
                {
                    activity.Date = activity.CreatedAt.ToString("yyyy-MM-dd");
                }
                
                // Log action ID if provided for tracking duplicate awards
                if (!string.IsNullOrEmpty(activity.ActionId))
                {
                    Console.WriteLine($"[DEBUG] Creating activity record for user {activity.UserId}, type: {activity.Type}, points: {activity.Points}, actionId: {activity.ActionId}");
                }
                else
                {
                    Console.WriteLine($"[DEBUG] Creating activity record for user {activity.UserId}, type: {activity.Type}, points: {activity.Points}");
                }
                
                await _activities.InsertOneAsync(activity);
                Console.WriteLine($"[DEBUG] Activity record created successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] Error creating activity: {ex.Message}");
                throw;
            }
        }

        public async Task<List<ActivityModel>> GetTodayActivitiesAsync(string userId, string actionId, string date)
        {
            Console.WriteLine($"[DEBUG] DB REQUEST: GetTodayActivitiesAsync({userId}, {actionId}, {date})");
            
            // Build filter based on whether we're checking by actionId or type
            var filter = Builders<ActivityModel>.Filter.And(
                Builders<ActivityModel>.Filter.Eq(a => a.UserId, userId),
                Builders<ActivityModel>.Filter.Eq(a => a.Date, date)
            );
            
            // If actionId is provided, use it for filtering instead of type
            if (!string.IsNullOrEmpty(actionId))
            {
                filter = filter & Builders<ActivityModel>.Filter.Eq(a => a.ActionId, actionId);
                Console.WriteLine($"[DEBUG] Filtering activities by actionId: {actionId}");
            }
            else
            {
                filter = filter & Builders<ActivityModel>.Filter.Eq(a => a.Type, actionId);
                Console.WriteLine($"[DEBUG] Filtering activities by type: {actionId}");
            }
            
            var results = await _activities.Find(filter).ToListAsync();
            Console.WriteLine($"[DEBUG] DB RESPONSE: Found {results.Count} activities for user {userId} with actionId/type {actionId} on {date}");
            return results;
        }

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
                
                _logger.LogInformation("MongoDB indexes created successfully");
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
                return null;
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
                    
                    // Ensure Bricks is properly initialized
                    if (user.Bricks == null)
                    {
                        user.Bricks = new BricksModel { Total = user.BricksTotal };
                    }
                    
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
                    
                    // Only preserve email if the new email is null or the placeholder email
                    if (string.IsNullOrEmpty(user.Email) || user.Email.Contains("@placeholder.ile"))
                    {
                        user.Email = existingUser.Email;
                    }
                    else
                    {
                        Console.WriteLine($"[DEBUG] DB UPDATE: Updating email for user {user.TelegramId} from {existingUser.Email} to {user.Email}");
                    }
                    
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
                
                // Add to user's referrals array without incrementing points (points are already awarded by PointsService)
                var update = Builders<UserModel>.Update
                    .Push(u => u.Referrals, referral)
                    .Set(u => u.UpdatedAt, DateTime.UtcNow);
                    // Removed .Inc("bricks.total", points) to prevent duplicate points
                    // Removed .Inc(u => u.Balance, points) to prevent duplicate points
                
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
                Console.WriteLine($"[MONGODB] UpdateUserBricksAsync called for user {userId} with {bricksTotal} bricks");
                _logger.LogInformation($"UpdateUserBricksAsync called for user {userId} with {bricksTotal} bricks");
                
                // Verify MongoDB connection before proceeding
                if (!await TestConnectionAsync())
                {
                    Console.WriteLine($"[MONGODB] ERROR: Database connection failed when trying to update bricks for user {userId}");
                    _logger.LogError($"Database connection failed when trying to update bricks for user {userId}");
                    return false;
                }
                
                var filter = Builders<UserModel>.Filter.Eq(u => u.TelegramId, userId);
                
                // First check if user exists
                Console.WriteLine($"[MONGODB] Checking if user {userId} exists in database");
                var user = await _users.Find(filter).FirstOrDefaultAsync();
                if (user == null)
                {
                    Console.WriteLine($"[MONGODB] User {userId} not found, creating new user with {bricksTotal} bricks");
                    _logger.LogInformation($"User {userId} not found, creating new user with {bricksTotal} bricks");
                    
                    // Create user if they don't exist
                    user = new UserModel
                    {
                        TelegramId = userId,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        Bricks = new BricksModel { Total = bricksTotal },
                        Balance = bricksTotal
                    };
                    
                    try
                    {
                        await _users.InsertOneAsync(user);
                        Console.WriteLine($"[MONGODB] Successfully created new user {userId} with {bricksTotal} bricks");
                        _logger.LogInformation($"Successfully created new user {userId} with {bricksTotal} bricks");
                        Logging.AddToLog($"Created new user with {bricksTotal} bricks: {userId}");
                        
                        // Verify user was created by retrieving it again
                        var verifyUser = await _users.Find(filter).FirstOrDefaultAsync();
                        if (verifyUser != null)
                        {
                            Console.WriteLine($"[MONGODB] Verified user {userId} was created with {verifyUser.Bricks?.Total ?? 0} bricks");
                            return true;
                        }
                        else
                        {
                            Console.WriteLine($"[MONGODB] WARNING: User {userId} was not found after creation");
                            return false;
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[MONGODB] ERROR creating user {userId}: {ex.Message}");
                        _logger.LogError($"Error creating user {userId}: {ex.Message}");
                        return false;
                    }
                }
                
                // User exists, update their bricks
                int currentBricks = user.Bricks?.Total ?? 0;
                int newTotal = currentBricks + bricksTotal;
                Console.WriteLine($"[MONGODB] User {userId} found, current bricks: {currentBricks}, adding: {bricksTotal}, new total will be: {newTotal}");
                _logger.LogInformation($"User {userId} found, current bricks: {currentBricks}, adding: {bricksTotal}, new total will be: {newTotal}");
                
                // Update existing user by incrementing bricks
                var update = Builders<UserModel>.Update
                    .Inc("bricks.total", bricksTotal)
                    .Inc(u => u.Balance, bricksTotal)
                    .Set(u => u.UpdatedAt, DateTime.UtcNow);
                
                try
                {
                    var result = await _users.UpdateOneAsync(filter, update);
                    
                    if (result.ModifiedCount > 0)
                    {
                        Console.WriteLine($"[MONGODB] Successfully updated bricks for user {userId}, modified count: {result.ModifiedCount}");
                        _logger.LogInformation($"Successfully updated bricks for user {userId}, modified count: {result.ModifiedCount}");
                        Logging.AddToLog($"Updated bricks for user {userId}, added {bricksTotal}, new total should be {newTotal}");
                        
                        // Verify the update by retrieving the user again
                        var updatedUser = await _users.Find(filter).FirstOrDefaultAsync();
                        if (updatedUser != null)
                        {
                            int updatedBricks = updatedUser.Bricks?.Total ?? 0;
                            Console.WriteLine($"[MONGODB] Verified user {userId} now has {updatedBricks} bricks (expected {newTotal})");
                            _logger.LogInformation($"Verified user {userId} now has {updatedBricks} bricks (expected {newTotal})");
                            
                            if (updatedBricks != newTotal)
                            {
                                Console.WriteLine($"[MONGODB] WARNING: Bricks total mismatch for user {userId}. Expected: {newTotal}, Actual: {updatedBricks}");
                                _logger.LogWarning($"Bricks total mismatch for user {userId}. Expected: {newTotal}, Actual: {updatedBricks}");
                            }
                        }
                        
                        return true;
                    }
                    else
                    {
                        Console.WriteLine($"[MONGODB] Failed to update bricks for user {userId}, modified count: {result.ModifiedCount}");
                        _logger.LogWarning($"Failed to update bricks for user {userId}, modified count: {result.ModifiedCount}");
                        Logging.AddToLog($"Failed to update bricks total for user {userId}");
                        return false;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[MONGODB] ERROR updating bricks for user {userId}: {ex.Message}");
                    _logger.LogError($"Error updating bricks for user {userId}: {ex.Message}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[MONGODB] EXCEPTION in UpdateUserBricksAsync: {ex.Message}");
                _logger.LogError($"Exception in UpdateUserBricksAsync: {ex.Message}");
                Logging.AddToLog($"Error updating user bricks: {ex.Message}");
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
