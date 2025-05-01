using System;
using System.Threading.Tasks;
using MongoDB.Driver;
using MongoDB.Bson;

namespace TelegramReferralBot
{
    /// <summary>
    /// Simple test class for MongoDB connection
    /// </summary>
    public class MongoDbTest
    {
        // Renamed to avoid conflict with Program.cs Main method
        public static async Task RunMongoDbTestMain(string[] args)
        {
            Console.WriteLine("MongoDB Test");
            await RunMongoDbTest();
        }

        public static async Task RunMongoDbTest()
        {
            Console.WriteLine("MongoDB Connection Test");
            Console.WriteLine("======================");
            
            try
            {
                // Load configuration
                LoadData.LoadConf();
                string connectionString = Config.MongoDbConnectionString;
                string dbName = Config.MongoDbDatabaseName;
                
                if (string.IsNullOrEmpty(connectionString))
                {
                    Console.WriteLine("Error: MongoDB connection string is empty. Check your config.conf file.");
                    return;
                }
                
                Console.WriteLine($"Using database: {dbName}");
                
                // Create a MongoDB client
                var client = new MongoClient(connectionString);
                Console.WriteLine("MongoDB client created successfully.");
                
                // Get the database
                var database = client.GetDatabase(dbName);
                Console.WriteLine("Database accessed successfully.");
                
                // List all collections in the database
                Console.WriteLine("\nCollections in the database:");
                using (var cursor = await database.ListCollectionsAsync())
                {
                    var collections = await cursor.ToListAsync();
                    foreach (var collection in collections)
                    {
                        var name = collection["name"].AsString;
                        Console.WriteLine($"- {name}");
                    }
                }
                
                // Check if users collection exists
                var usersCollection = database.GetCollection<BsonDocument>("users");
                var userCount = await usersCollection.CountDocumentsAsync(new BsonDocument());
                Console.WriteLine($"\nFound {userCount} documents in the users collection.");
                
                // Check if referrals collection exists
                var referralsCollection = database.GetCollection<BsonDocument>("referrals");
                var referralCount = await referralsCollection.CountDocumentsAsync(new BsonDocument());
                Console.WriteLine($"Found {referralCount} documents in the referrals collection.");
                
                Console.WriteLine("\nMongoDB connection test completed successfully!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
            }
        }
    }
}
