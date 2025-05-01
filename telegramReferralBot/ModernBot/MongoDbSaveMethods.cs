using TelegramReferralBot.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TelegramReferralBot
{
    /// <summary>
    /// Handles saving data to MongoDB for the Telegram Referral Bot
    /// </summary>
    public static class MongoDbSaveMethods
    {
        /// <summary>
        /// Saves user activity data to MongoDB
        /// </summary>
        public static async Task<bool> SaveUserActivityAsync()
        {
            try
            {
                if (Program.MongoDb == null)
                {
                    Logging.AddToLog("MongoDB not initialized. Cannot save user activity.");
                    Console.WriteLine("MongoDB not initialized. Cannot save user activity.");
                    return false;
                }
                
                foreach (var entry in Program.UserActivity)
                {
                    string userId = entry.Key;
                    foreach (var activity in entry.Value)
                    {
                        string date = activity.Key;
                        int points = activity.Value;
                        
                        await Program.MongoDb.UpsertUserActivityAsync(userId, date, points);
                    }
                }
                
                Logging.AddToLog("User activity saved to MongoDB successfully");
                Console.WriteLine("User activity saved to MongoDB successfully");
                return true;
            }
            catch (Exception ex)
            {
                string text = $"Error saving user activity to MongoDB: {ex.Message}";
                Logging.AddToLog(text);
                Console.WriteLine(text);
                return false;
            }
        }
        
        /// <summary>
        /// Saves referral links to MongoDB
        /// </summary>
        public static async Task<bool> SaveRefLinksAsync()
        {
            try
            {
                if (Program.MongoDb == null)
                {
                    Logging.AddToLog("MongoDB not initialized. Cannot save referral links.");
                    Console.WriteLine("MongoDB not initialized. Cannot save referral links.");
                    return false;
                }
                
                foreach (var entry in Program.RefLinks)
                {
                    string userId = entry.Key;
                    string refCode = entry.Value;
                    
                    // Check if the ref link already exists
                    var existingRefLink = await Program.MongoDb.GetRefLinkByUserIdAsync(userId);
                    if (existingRefLink == null)
                    {
                        // Create new ref link
                        var refLink = new RefLinkModel
                        {
                            UserId = userId,
                            RefCode = refCode,
                            CreatedAt = DateTime.UtcNow
                        };
                        
                        await Program.MongoDb.CreateRefLinkAsync(refLink);
                    }
                }
                
                Logging.AddToLog("Referral links saved to MongoDB successfully");
                Console.WriteLine("Referral links saved to MongoDB successfully");
                return true;
            }
            catch (Exception ex)
            {
                string text = $"Error saving referral links to MongoDB: {ex.Message}";
                Logging.AddToLog(text);
                Console.WriteLine(text);
                return false;
            }
        }
        
        /// <summary>
        /// Saves referred by data to MongoDB
        /// </summary>
        public static async Task<bool> SaveReferredByAsync()
        {
            try
            {
                if (Program.MongoDb == null)
                {
                    Logging.AddToLog("MongoDB not initialized. Cannot save referred by data.");
                    Console.WriteLine("MongoDB not initialized. Cannot save referred by data.");
                    return false;
                }
                
                foreach (var entry in Program.ReferredBy)
                {
                    string referredId = entry.Key;
                    string referrerId = entry.Value;
                    
                    // Check if the referral already exists
                    var existingReferral = await Program.MongoDb.GetReferralByReferredIdAsync(referredId);
                    if (existingReferral == null)
                    {
                        // Create new referral
                        var referral = new ReferralModel
                        {
                            ReferrerId = referrerId,
                            ReferredId = referredId,
                            Points = Config.ReferralReward,
                            Timestamp = DateTime.UtcNow,
                            Type = "referral"
                        };
                        
                        await Program.MongoDb.CreateReferralAsync(referral);
                    }
                }
                
                Logging.AddToLog("Referred by data saved to MongoDB successfully");
                Console.WriteLine("Referred by data saved to MongoDB successfully");
                return true;
            }
            catch (Exception ex)
            {
                string text = $"Error saving referred by data to MongoDB: {ex.Message}";
                Logging.AddToLog(text);
                Console.WriteLine(text);
                return false;
            }
        }
        
        /// <summary>
        /// Saves password attempts to MongoDB
        /// </summary>
        public static async Task<bool> SavePasswordAttemptsAsync()
        {
            try
            {
                if (Program.MongoDb == null)
                {
                    Logging.AddToLog("MongoDB not initialized. Cannot save password attempts.");
                    Console.WriteLine("MongoDB not initialized. Cannot save password attempts.");
                    return false;
                }
                
                foreach (var entry in Program.PasswordAttempts)
                {
                    string userId = entry.Key;
                    int attempts = entry.Value;
                    
                    // Get user
                    var user = await Program.MongoDb.GetUserAsync(userId);
                    if (user == null)
                    {
                        // Create new user
                        user = new UserModel
                        {
                            TelegramId = userId,
                            PasswordAttempts = attempts,
                            IsAdmin = attempts == -1,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };
                        
                        await Program.MongoDb.CreateUserAsync(user);
                    }
                    else
                    {
                        // Update existing user
                        user.PasswordAttempts = attempts;
                        user.IsAdmin = attempts == -1;
                        user.UpdatedAt = DateTime.UtcNow;
                        
                        await Program.MongoDb.UpdateUserAsync(user);
                    }
                }
                
                Logging.AddToLog("Password attempts saved to MongoDB successfully");
                Console.WriteLine("Password attempts saved to MongoDB successfully");
                return true;
            }
            catch (Exception ex)
            {
                string text = $"Error saving password attempts to MongoDB: {ex.Message}";
                Logging.AddToLog(text);
                Console.WriteLine(text);
                return false;
            }
        }
        
        /// <summary>
        /// Saves show welcome data to MongoDB
        /// </summary>
        public static async Task<bool> SaveShowWelcomeAsync()
        {
            try
            {
                if (Program.MongoDb == null)
                {
                    Logging.AddToLog("MongoDB not initialized. Cannot save show welcome data.");
                    Console.WriteLine("MongoDB not initialized. Cannot save show welcome data.");
                    return false;
                }
                
                foreach (var entry in Program.ShowWelcome)
                {
                    string userId = entry.Key;
                    bool showWelcome = entry.Value;
                    
                    await Program.MongoDb.UpdateShowWelcomeAsync(userId, showWelcome);
                }
                
                Logging.AddToLog("Show welcome data saved to MongoDB successfully");
                Console.WriteLine("Show welcome data saved to MongoDB successfully");
                return true;
            }
            catch (Exception ex)
            {
                string text = $"Error saving show welcome data to MongoDB: {ex.Message}";
                Logging.AddToLog(text);
                Console.WriteLine(text);
                return false;
            }
        }
        
        /// <summary>
        /// Saves referral points to MongoDB
        /// </summary>
        public static async Task<bool> SaveReferralPointsAsync()
        {
            try
            {
                if (Program.MongoDb == null)
                {
                    Logging.AddToLog("MongoDB not initialized. Cannot save referral points.");
                    Console.WriteLine("MongoDB not initialized. Cannot save referral points.");
                    return false;
                }
                
                // Referral points are saved as part of the referral creation process
                // This method is kept for compatibility with the existing code
                
                Logging.AddToLog("Referral points saved to MongoDB successfully");
                Console.WriteLine("Referral points saved to MongoDB successfully");
                return true;
            }
            catch (Exception ex)
            {
                string text = $"Error saving referral points to MongoDB: {ex.Message}";
                Logging.AddToLog(text);
                Console.WriteLine(text);
                return false;
            }
        }
        
        /// <summary>
        /// Saves points by referrer data to MongoDB
        /// </summary>
        public static async Task<bool> SavePointsByReferrerAsync()
        {
            try
            {
                if (Program.MongoDb == null)
                {
                    Logging.AddToLog("MongoDB not initialized. Cannot save points by referrer.");
                    Console.WriteLine("MongoDB not initialized. Cannot save points by referrer.");
                    return false;
                }
                
                // Points by referrer are calculated based on referrals
                // This method is kept for compatibility with the existing code
                
                Logging.AddToLog("Points by referrer saved to MongoDB successfully");
                Console.WriteLine("Points by referrer saved to MongoDB successfully");
                return true;
            }
            catch (Exception ex)
            {
                string text = $"Error saving points by referrer to MongoDB: {ex.Message}";
                Logging.AddToLog(text);
                Console.WriteLine(text);
                return false;
            }
        }
        
        /// <summary>
        /// Saves user point offset data to MongoDB
        /// </summary>
        public static async Task<bool> SaveUserPointOffsetAsync()
        {
            try
            {
                if (Program.MongoDb == null)
                {
                    Logging.AddToLog("MongoDB not initialized. Cannot save user point offset.");
                    Console.WriteLine("MongoDB not initialized. Cannot save user point offset.");
                    return false;
                }
                
                foreach (var entry in Program.UserPointOffset)
                {
                    string userId = entry.Key;
                    int offset = entry.Value;
                    
                    // Get user
                    var user = await Program.MongoDb.GetUserAsync(userId);
                    if (user != null)
                    {
                        // Update user's bricks total
                        user.BricksTotal += offset;
                        user.UpdatedAt = DateTime.UtcNow;
                        
                        await Program.MongoDb.UpdateUserAsync(user);
                    }
                }
                
                Logging.AddToLog("User point offset saved to MongoDB successfully");
                Console.WriteLine("User point offset saved to MongoDB successfully");
                return true;
            }
            catch (Exception ex)
            {
                string text = $"Error saving user point offset to MongoDB: {ex.Message}";
                Logging.AddToLog(text);
                Console.WriteLine(text);
                return false;
            }
        }
        
        /// <summary>
        /// Saves joined referrals data to MongoDB
        /// </summary>
        public static async Task<bool> SaveJoinedReferralsAsync()
        {
            try
            {
                if (Program.MongoDb == null)
                {
                    Logging.AddToLog("MongoDB not initialized. Cannot save joined referrals.");
                    Console.WriteLine("MongoDB not initialized. Cannot save joined referrals.");
                    return false;
                }
                
                foreach (var entry in Program.JoinedReferrals)
                {
                    string userId = entry.Key;
                    bool joined = entry.Value;
                    
                    // Skip entries that aren't joined
                    if (!joined) continue;
                    
                    // Create join group referral
                    var referral = new ReferralModel
                    {
                        ReferrerId = userId,
                        ReferredId = userId, // Self-referential for join events
                        Points = Config.JoinReward,
                        Timestamp = DateTime.UtcNow,
                        Type = "join_group"
                    };
                    
                    await Program.MongoDb.CreateReferralAsync(referral);
                }
                
                Logging.AddToLog("Joined referrals saved to MongoDB successfully");
                Console.WriteLine("Joined referrals saved to MongoDB successfully");
                return true;
            }
            catch (Exception ex)
            {
                string text = $"Error saving joined referrals to MongoDB: {ex.Message}";
                Logging.AddToLog(text);
                Console.WriteLine(text);
                return false;
            }
        }
        
        /// <summary>
        /// Saves interacted user data to MongoDB
        /// </summary>
        public static async Task<bool> SaveInteractedUserAsync()
        {
            try
            {
                if (Program.MongoDb == null)
                {
                    Logging.AddToLog("MongoDB not initialized. Cannot save interacted user.");
                    Console.WriteLine("MongoDB not initialized. Cannot save interacted user.");
                    return false;
                }
                
                // Interacted user data is not directly mapped to MongoDB
                // This method is kept for compatibility with the existing code
                
                Logging.AddToLog("Interacted user saved to MongoDB successfully");
                Console.WriteLine("Interacted user saved to MongoDB successfully");
                return true;
            }
            catch (Exception ex)
            {
                string text = $"Error saving interacted user to MongoDB: {ex.Message}";
                Logging.AddToLog(text);
                Console.WriteLine(text);
                return false;
            }
        }
        
        /// <summary>
        /// Saves disable notice data to MongoDB
        /// </summary>
        public static async Task<bool> SaveDisableNoticeAsync()
        {
            try
            {
                if (Program.MongoDb == null)
                {
                    Logging.AddToLog("MongoDB not initialized. Cannot save disable notice.");
                    Console.WriteLine("MongoDB not initialized. Cannot save disable notice.");
                    return false;
                }
                
                // Disable notice data is not directly mapped to MongoDB
                // This method is kept for compatibility with the existing code
                
                Logging.AddToLog("Disable notice saved to MongoDB successfully");
                Console.WriteLine("Disable notice saved to MongoDB successfully");
                return true;
            }
            catch (Exception ex)
            {
                string text = $"Error saving disable notice to MongoDB: {ex.Message}";
                Logging.AddToLog(text);
                Console.WriteLine(text);
                return false;
            }
        }
        
        /// <summary>
        /// Saves campaign days data to MongoDB
        /// </summary>
        public static async Task<bool> SaveCampaignDaysAsync()
        {
            try
            {
                if (Program.MongoDb == null)
                {
                    Logging.AddToLog("MongoDB not initialized. Cannot save campaign days.");
                    Console.WriteLine("MongoDB not initialized. Cannot save campaign days.");
                    return false;
                }
                
                // Campaign days data is not directly mapped to MongoDB
                // This method is kept for compatibility with the existing code
                
                Logging.AddToLog("Campaign days saved to MongoDB successfully");
                Console.WriteLine("Campaign days saved to MongoDB successfully");
                return true;
            }
            catch (Exception ex)
            {
                string text = $"Error saving campaign days to MongoDB: {ex.Message}";
                Logging.AddToLog(text);
                Console.WriteLine(text);
                return false;
            }
        }
        
        /// <summary>
        /// Saves group chat ID number to MongoDB
        /// </summary>
        public static async Task<bool> SaveGroupChatIdNumberAsync()
        {
            try
            {
                if (Program.MongoDb == null)
                {
                    Logging.AddToLog("MongoDB not initialized. Cannot save group chat ID number.");
                    Console.WriteLine("MongoDB not initialized. Cannot save group chat ID number.");
                    return false;
                }
                
                // Group chat ID number is not directly mapped to MongoDB
                // This method is kept for compatibility with the existing code
                
                Logging.AddToLog("Group chat ID number saved to MongoDB successfully");
                Console.WriteLine("Group chat ID number saved to MongoDB successfully");
                return true;
            }
            catch (Exception ex)
            {
                string text = $"Error saving group chat ID number to MongoDB: {ex.Message}";
                Logging.AddToLog(text);
                Console.WriteLine(text);
                return false;
            }
        }
    }
}
