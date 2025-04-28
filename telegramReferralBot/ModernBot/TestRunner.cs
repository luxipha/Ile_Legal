using System;
using System.Threading.Tasks;
using Telegram.Bot;

namespace TelegramReferralBot
{
    /// <summary>
    /// Test runner for the Telegram Referral Bot
    /// </summary>
    public class TestRunner
    {
        public static async Task RunTests()
        {
            Console.WriteLine("Telegram Referral Bot Test Runner");
            Console.WriteLine("=================================");
            
            try
            {
                // Load configuration
                LoadData.LoadConf();
                Console.WriteLine("Configuration loaded successfully.");
                
                // Initialize bot client in Program class
                Program.BotClient = new TelegramBotClient(Config.BotAccessToken);
                Console.WriteLine("Bot client initialized.");
                
                // Get bot info
                var me = await Program.BotClient.GetMeAsync();
                Console.WriteLine($"Connected to bot: {me.FirstName} (@{me.Username})");
                
                // Ask for test parameters
                Console.Write("Enter your Telegram User ID for testing: ");
                string testUserId = Console.ReadLine() ?? "0";
                
                Console.Write("Enter a Chat ID for private chat testing: ");
                if (!long.TryParse(Console.ReadLine(), out long testChatId))
                {
                    testChatId = 0;
                }
                
                Console.Write("Enter a Group Chat ID for group testing: ");
                if (!long.TryParse(Console.ReadLine(), out long testGroupId))
                {
                    testGroupId = Config.GroupChatIdNumber;
                }
                
                // Create and run the tester
                var tester = new TelegramBotTester(testChatId, testGroupId, testUserId);
                await tester.RunAllTests();
                
                Console.WriteLine("\nTests completed. Press any key to exit...");
                Console.ReadKey();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                Console.WriteLine("\nPress any key to exit...");
                Console.ReadKey();
            }
        }
    }
}
