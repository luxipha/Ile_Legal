using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Telegram.Bot;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;

namespace TelegramReferralBot
{
    /// <summary>
    /// Test harness for the Telegram Referral Bot
    /// This class simulates various user interactions to test bot functionality
    /// </summary>
    public class TelegramBotTester
    {
        private readonly long _testChatId;
        private readonly long _testGroupId;
        private readonly string _adminUserId;
        private readonly CancellationTokenSource _cts = new();

        public TelegramBotTester(long testChatId, long testGroupId, string adminUserId)
        {
            _testChatId = testChatId;
            _testGroupId = testGroupId;
            _adminUserId = adminUserId;
        }

        /// <summary>
        /// Run all tests
        /// </summary>
        public async Task RunAllTests()
        {
            Console.WriteLine("Starting Telegram Bot Tests...");
            
            try
            {
                // Test basic commands
                await TestBasicCommands();
                
                // Test admin commands
                await TestAdminCommands();
                
                // Test referral functionality
                await TestReferralFunctionality();
                
                // Test group chat commands
                await TestGroupChatCommands();
                
                Console.WriteLine("All tests completed successfully!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Test failed: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
            }
        }

        /// <summary>
        /// Test basic user commands
        /// </summary>
        private async Task TestBasicCommands()
        {
            Console.WriteLine("\n=== Testing Basic Commands ===");
            
            // Test /start command
            Console.WriteLine("Testing /start command...");
            await SimulateCommand("/start");
            
            // Test /help command
            Console.WriteLine("Testing /help command...");
            await SimulateCommand("/help");
            
            // Test /getRefLink command
            Console.WriteLine("Testing /getRefLink command...");
            await SimulateCommand("/getRefLink");
            
            // Test /myPoints command
            Console.WriteLine("Testing /myPoints command...");
            await SimulateCommand("/myPoints");
            
            // Test /top10 command
            Console.WriteLine("Testing /top10 command...");
            await SimulateCommand("/top10");
            
            // Test /myID command
            Console.WriteLine("Testing /myID command...");
            await SimulateCommand("/myID");
            
            // Test /refTotal command
            Console.WriteLine("Testing /refTotal command...");
            await SimulateCommand("/refTotal");
            
            // Test /listAll command
            Console.WriteLine("Testing /listAll command...");
            await SimulateCommand("/listAll");
            
            // Test /listRef command
            Console.WriteLine("Testing /listRef command...");
            await SimulateCommand("/listRef");
            
            // Test /enableNotice command
            Console.WriteLine("Testing /enableNotice command...");
            await SimulateCommand("/enableNotice");
            
            // Test /disableNotice command
            Console.WriteLine("Testing /disableNotice command...");
            await SimulateCommand("/disableNotice");
            
            Console.WriteLine("Basic commands tested successfully!");
        }

        /// <summary>
        /// Test admin commands
        /// </summary>
        private async Task TestAdminCommands()
        {
            Console.WriteLine("\n=== Testing Admin Commands ===");
            
            // Test /admin command
            Console.WriteLine("Testing /admin command...");
            await SimulateCommand("/admin");
            
            // Simulate password entry
            Console.WriteLine("Simulating password entry...");
            await SimulateMessage(Config.AdminPassword);
            
            // Test /ban command
            Console.WriteLine("Testing /ban command...");
            await SimulateCommand("/ban 123456789");
            
            // Test /unban command
            Console.WriteLine("Testing /unban command...");
            await SimulateCommand("/unban 123456789");
            
            // Test /setgroup command
            Console.WriteLine("Testing /setgroup command...");
            await SimulateCommand($"/setgroup {_testGroupId}");
            
            // Test /FindMemberID command
            Console.WriteLine("Testing /FindMemberID command...");
            await SimulateCommand("/FindMemberID testuser");
            
            // Test /editUser command
            Console.WriteLine("Testing /editUser command...");
            await SimulateCommand("/editUser");
            
            Console.WriteLine("Admin commands tested successfully!");
        }

        /// <summary>
        /// Test referral functionality
        /// </summary>
        private async Task TestReferralFunctionality()
        {
            Console.WriteLine("\n=== Testing Referral Functionality ===");
            
            // Get a referral link
            Console.WriteLine("Getting referral link...");
            await SimulateCommand("/getRefLink");
            
            // Simulate a user joining with a referral link
            Console.WriteLine("Simulating user joining with referral link...");
            await SimulateCommand("/start abc123"); // Using a dummy referral code
            
            // Check points after referral
            Console.WriteLine("Checking points after referral...");
            await SimulateCommand("/myPoints");
            
            Console.WriteLine("Referral functionality tested successfully!");
        }

        /// <summary>
        /// Test group chat commands
        /// </summary>
        private async Task TestGroupChatCommands()
        {
            Console.WriteLine("\n=== Testing Group Chat Commands ===");
            
            // Test /disableWelcome command in group
            Console.WriteLine("Testing /disableWelcome command in group...");
            await SimulateGroupCommand("/disableWelcome");
            
            // Test /enableWelcome command in group
            Console.WriteLine("Testing /enableWelcome command in group...");
            await SimulateGroupCommand("/enableWelcome");
            
            // Test /help command in group
            Console.WriteLine("Testing /help command in group...");
            await SimulateGroupCommand("/help");
            
            // Test /myID command in group
            Console.WriteLine("Testing /myID command in group...");
            await SimulateGroupCommand("/myID");
            
            // Test /top10 command in group
            Console.WriteLine("Testing /top10 command in group...");
            await SimulateGroupCommand("/top10");
            
            // Test /refTotal command in group
            Console.WriteLine("Testing /refTotal command in group...");
            await SimulateGroupCommand("/refTotal");
            
            Console.WriteLine("Group chat commands tested successfully!");
        }

        /// <summary>
        /// Simulate sending a command to the bot in private chat
        /// </summary>
        private async Task SimulateCommand(string command)
        {
            var message = CreateMockMessage(command, _testChatId, ChatType.Private);
            await MessageProcessor.ProcessMessageAsync(message, _cts.Token);
            await Task.Delay(500); // Give the bot time to process and respond
        }

        /// <summary>
        /// Simulate sending a message to the bot in private chat
        /// </summary>
        private async Task SimulateMessage(string text)
        {
            var message = CreateMockMessage(text, _testChatId, ChatType.Private);
            await MessageProcessor.ProcessMessageAsync(message, _cts.Token);
            await Task.Delay(500); // Give the bot time to process and respond
        }

        /// <summary>
        /// Simulate sending a command to the bot in group chat
        /// </summary>
        private async Task SimulateGroupCommand(string command)
        {
            var message = CreateMockMessage(command, _testGroupId, ChatType.Group);
            await MessageProcessor.ProcessMessageAsync(message, _cts.Token);
            await Task.Delay(500); // Give the bot time to process and respond
        }

        /// <summary>
        /// Create a mock message object for testing
        /// </summary>
        private Message CreateMockMessage(string text, long chatId, ChatType chatType)
        {
            return new Message
            {
                MessageId = new Random().Next(1, 1000000),
                From = new User
                {
                    Id = long.Parse(_adminUserId),
                    FirstName = "Test",
                    LastName = "User",
                    Username = "testuser"
                },
                Chat = new Chat
                {
                    Id = chatId,
                    Type = chatType,
                    Title = chatType == ChatType.Group ? "Test Group" : null
                },
                Date = DateTime.UtcNow,
                Text = text
            };
        }
    }
}
