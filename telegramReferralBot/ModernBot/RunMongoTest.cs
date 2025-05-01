using System;
using System.Threading.Tasks;
using MongoDB.Driver;
using TelegramReferralBot.Models;
using TelegramReferralBot.Services;

namespace TelegramReferralBot
{
    public class RunMongoTest
    {
        public static async Task RunTest(string[] args)
        {
            Console.WriteLine("MongoDB Integration Test");
            Console.WriteLine("=======================");
            
            try
            {
                // Load connection string from config.conf
                string connectionString = "mongodb+srv://ileAdmin:ileAdmin@cluster0.jnwkzrv.mongodb.net/?retryWrites=true&w=majority";
                string dbName = "ileDB";
                
                Console.WriteLine($"Connecting to MongoDB database: {dbName}");
                
                // Create MongoDB service
                var mongoDbService = new MongoDbService(connectionString, dbName);
                
                // Test user operations
                Console.WriteLine("\nTesting user operations:");
                
                // Create a test user
                var testUser = new UserModel
                {
                    TelegramId = "test_user_" + DateTime.Now.Ticks,
                    FirstName = "Test",
                    LastName = "User",
                    Username = "testuser",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                
                // Set bricks using the property that handles the nested structure
                testUser.BricksTotal = 100;
                
                // Create user
                await mongoDbService.CreateUserAsync(testUser);
                Console.WriteLine($"Created test user with ID: {testUser.TelegramId}");
                
                // Get user
                var retrievedUser = await mongoDbService.GetUserAsync(testUser.TelegramId);
                Console.WriteLine($"Retrieved user: {retrievedUser.TelegramId}, Bricks: {retrievedUser.BricksTotal}");
                
                // Update user bricks
                await mongoDbService.UpdateUserBricksAsync(testUser.TelegramId, 200);
                Console.WriteLine($"Updated user bricks to 200");
                
                // Get updated user
                retrievedUser = await mongoDbService.GetUserAsync(testUser.TelegramId);
                Console.WriteLine($"Retrieved updated user: {retrievedUser.TelegramId}, Bricks: {retrievedUser.BricksTotal}");
                
                // Test referral operations
                Console.WriteLine("\nTesting referral operations:");
                
                // Create a referral
                var referral = new ReferralModel
                {
                    ReferrerId = testUser.TelegramId,
                    ReferredId = "referred_user_" + DateTime.Now.Ticks,
                    Points = 150,
                    Timestamp = DateTime.UtcNow,
                    Type = "referral"
                };
                
                await mongoDbService.CreateReferralAsync(referral);
                Console.WriteLine($"Created referral: {referral.ReferrerId} -> {referral.ReferredId}");
                
                // Add to user's referrals array
                await mongoDbService.AddReferralToUserAsync(
                    referral.ReferrerId,
                    referral.ReferredId,
                    "Referred Test User",
                    referral.Points);
                
                Console.WriteLine($"Added referral to user's referrals array");
                
                // Get updated user with referrals
                retrievedUser = await mongoDbService.GetUserAsync(testUser.TelegramId);
                Console.WriteLine($"User now has {retrievedUser.Referrals.Count} referrals and {retrievedUser.BricksTotal} bricks");
                
                Console.WriteLine("\nMongoDB integration test completed successfully!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
            }
        }
    }
}
