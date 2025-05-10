using System;
using System.Threading;
using System.Threading.Tasks;
using System.Text;
using Telegram.Bot;
using Telegram.Bot.Types;
using Telegram.Bot.Types.ReplyMarkups;
using TelegramReferralBot.Services;
using TelegramReferralBot.Utils;

namespace TelegramReferralBot.Handlers
{
    public class AdminHandler
    {
        private readonly ITelegramBotClient _botClient;
        private readonly MongoDbService _mongoDb;
        private readonly IBotLogger _logger;

        public AdminHandler(
            ITelegramBotClient botClient,
            MongoDbService mongoDb,
            ILogger logger)
        {
            _botClient = botClient;
            _mongoDb = mongoDb;
            _logger = new LoggerAdapter(logger);
        }

        /// <summary>
        /// Lists all members with their Bricks
        /// </summary>
        public async Task ListAllMembersAsync(Message message, CancellationToken cancellationToken)
        {
            if (!await IsAdmin(message))
            {
                await _botClient.SendTextMessageAsync(
                    chatId: message.Chat.Id,
                    text: "This command is for admins only.",
                    cancellationToken: cancellationToken
                );
                return;
            }

            try
            {
                var sb = new StringBuilder();
                sb.AppendLine("📊 *All Members Bricks* 📊\n");

                var users = await _mongoDb.GetAllUsersAsync();
                foreach (var user in users)
                {
                    string username = await GetUsernameAsync(user.TelegramId);
                    sb.AppendLine($"{username}: {user.BricksTotal} Bricks");
                }

                await _botClient.SendTextMessageAsync(
                    chatId: message.Chat.Id,
                    text: sb.ToString(),
                    parseMode: Telegram.Bot.Types.Enums.ParseMode.Markdown,
                    cancellationToken: cancellationToken
                );
            }
            catch (Exception ex)
            {
                _logger.Log($"Error listing all members: {ex.Message}");
            }
        }

        /// <summary>
        /// Bans a user from the referral program
        /// </summary>
        public async Task BanUserAsync(Message message, CancellationToken cancellationToken)
        {
            if (!await IsAdmin(message))
            {
                await _botClient.SendTextMessageAsync(
                    chatId: message.Chat.Id,
                    text: "This command is for admins only.",
                    cancellationToken: cancellationToken
                );
                return;
            }

            string[] args = message.Text.Split(' ');
            if (args.Length != 2)
            {
                await _botClient.SendTextMessageAsync(
                    chatId: message.Chat.Id,
                    text: "Usage: /ban @username",
                    cancellationToken: cancellationToken
                );
                return;
            }

            string username = args[1].TrimStart('@');
            var userId = await FindMemberIdAsync(username);
            if (string.IsNullOrEmpty(userId))
            {
                await _botClient.SendTextMessageAsync(
                    chatId: message.Chat.Id,
                    text: "User not found.",
                    cancellationToken: cancellationToken
                );
                return;
            }

            await _mongoDb.BanUserAsync(userId);
            await _botClient.SendTextMessageAsync(
                chatId: message.Chat.Id,
                text: $"User {username} has been banned from the referral program.",
                cancellationToken: cancellationToken
            );
        }

        private async Task<bool> IsAdmin(Message message)
        {
            if (message.From == null) return false;
            
            // Get user ID
            string userId = message.From.Id.ToString();
            
            // Check if user is admin in our database
            var user = await _mongoDb.GetUserByIdAsync(userId);
            
            Console.WriteLine($"[DEBUG] Checking admin status for user {userId}: {(user?.IsAdmin == true ? "Admin" : "Not Admin")}");
            
            return user?.IsAdmin == true;
        }

        private async Task<string> GetUsernameAsync(string userId)
        {
            try
            {
                var chat = await _botClient.GetChatAsync(long.Parse(userId));
                return chat.Username ?? chat.FirstName ?? userId;
            }
            catch
            {
                return userId;
            }
        }

        private async Task<string> FindMemberIdAsync(string username)
        {
            try
            {
                var users = await _mongoDb.GetAllUsersAsync();
                var user = users.FirstOrDefault(u => u.Username?.ToLower() == username.ToLower());
                return user?.TelegramId;
            }
            catch (Exception ex)
            {
                _logger.Log($"Error finding member ID: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// Handles the /admin command which asks for a password
        /// </summary>
        public async Task HandleAdminCommandAsync(Message message, CancellationToken cancellationToken)
        {
            var userId = message.From?.Id.ToString();
            var chatId = message.Chat.Id;
            
            Console.WriteLine($"[DEBUG] /admin command received from user {userId} in chat {chatId}");
            
            if (string.IsNullOrEmpty(userId))
                return;

            // Check if this is a private chat
            if (message.Chat.Type != Telegram.Bot.Types.Enums.ChatType.Private)
            {
                await _botClient.SendTextMessageAsync(
                    chatId: chatId,
                    text: "This command can only be used in a private chat with the bot.",
                    cancellationToken: cancellationToken
                );
                return;
            }

            // Parse command to check if password is included
            string[] parts = message.Text.Split(' ');
            if (parts.Length > 1)
            {
                // Password is included in the command
                string password = parts[1];
                await VerifyAdminPasswordAsync(userId, chatId, password, cancellationToken);
            }
            else
            {
                // Ask for password
                await _botClient.SendTextMessageAsync(
                    chatId: chatId,
                    text: "Please enter the admin password using the format: /admin [password]",
                    cancellationToken: cancellationToken
                );
            }
        }

        /// <summary>
        /// Verifies the admin password and sets the user as admin if correct
        /// </summary>
        private async Task VerifyAdminPasswordAsync(string userId, long chatId, string password, CancellationToken cancellationToken)
        {
            Console.WriteLine($"[DEBUG] Verifying admin password for user {userId}");
            
            // Get admin password from environment variable
            string adminPassword = Environment.GetEnvironmentVariable("ADMIN_PASSWORD") ?? "";
            
            Console.WriteLine($"[DEBUG] Admin password from env: '{adminPassword}', user entered: '{password}'");
            
            if (string.IsNullOrEmpty(adminPassword))
            {
                Console.WriteLine($"[DEBUG] ADMIN_PASSWORD environment variable is not set");
                _logger.Log("ADMIN_PASSWORD environment variable is not set");
                await _botClient.SendTextMessageAsync(
                    chatId: chatId,
                    text: "Admin authentication is not configured. Please contact the bot administrator.",
                    cancellationToken: cancellationToken
                );
                return;
            }

            // Compare passwords with detailed logging
            bool passwordMatches = password == adminPassword;
            Console.WriteLine($"[DEBUG] Password match result: {passwordMatches}");
            
            if (passwordMatches)
            {
                Console.WriteLine($"[DEBUG] Admin password verification successful for user {userId}");
                // Password is correct, set user as admin
                bool success = await _mongoDb.SetUserAsAdminAsync(userId);
                Console.WriteLine($"[DEBUG] SetUserAsAdminAsync result: {success}");
                
                if (success)
                {
                    Console.WriteLine($"[DEBUG] Successfully set user {userId} as admin");
                    await _botClient.SendTextMessageAsync(
                        chatId: chatId,
                        text: "✅ Admin authentication successful! You now have admin privileges.",
                        cancellationToken: cancellationToken
                    );
                    
                    // Show admin dashboard directly
                    Console.WriteLine($"[DEBUG] About to show admin dashboard for chat {chatId}");
                    
                    // Create the main menu with categories
                    var mainMenuButtons = new[]
                    {
                        new[] { InlineKeyboardButton.WithCallbackData("👥 User Management", "admin_category_users") },
                        new[] { InlineKeyboardButton.WithCallbackData("⚙️ Group Settings", "admin_category_settings") },
                        new[] { InlineKeyboardButton.WithCallbackData("📊 Statistics", "admin_category_stats") }
                    };

                    string adminWelcomeMessage = "🔐 *Admin Dashboard* 🔐\n\n" +
                                              "Welcome to the admin control panel. Use the buttons below to access admin functions.\n\n" +
                                              "Available admin commands:\n" +
                                              "• /listAll - Full list of all members with points\n" +
                                              "• /FindMemberID - Find a user's ID by username\n" +
                                              "• /editUser - Edit user data";

                    await _botClient.SendTextMessageAsync(
                        chatId: chatId,
                        text: adminWelcomeMessage,
                        parseMode: Telegram.Bot.Types.Enums.ParseMode.Markdown,
                        replyMarkup: new InlineKeyboardMarkup(mainMenuButtons),
                        cancellationToken: cancellationToken
                    );
                    
                    Console.WriteLine($"[DEBUG] Finished showing admin dashboard for chat {chatId}");
                }
                else
                {
                    await _botClient.SendTextMessageAsync(
                        chatId: chatId,
                        text: "⚠️ Failed to set admin privileges. Please try again later or contact support.",
                        cancellationToken: cancellationToken
                    );
                }
            }
            else
            {
                // Password is incorrect
                await _botClient.SendTextMessageAsync(
                    chatId: chatId,
                    text: "❌ Incorrect password. Admin authentication failed.",
                    cancellationToken: cancellationToken
                );
                
                // Increment password attempts
                await _mongoDb.UpdatePasswordAttemptsAsync(userId, 1);
            }
        }

        /// <summary>
        /// Handles the /editUser command to modify user data
        /// </summary>
        public async Task HandleEditUserCommandAsync(Message message, CancellationToken cancellationToken)
        {
            if (!await IsAdmin(message))
            {
                await _botClient.SendTextMessageAsync(
                    chatId: message.Chat.Id,
                    text: "This command is for admins only.",
                    cancellationToken: cancellationToken
                );
                return;
            }

            string[] args = message.Text.Split(' ');
            if (args.Length < 4)
            {
                await _botClient.SendTextMessageAsync(
                    chatId: message.Chat.Id,
                    text: "Usage: /editUser [userId] [field] [value]\n\n" +
                          "Available fields:\n" +
                          "• bricks - Set user's Bricks total\n" +
                          "• admin - Set admin status (true/false)\n" +
                          "• ban - Set ban status (true/false)\n" +
                          "• username - Update username\n" +
                          "• email - Update email",
                    cancellationToken: cancellationToken
                );
                return;
            }

            string userId = args[1];
            string field = args[2].ToLower();
            string value = string.Join(" ", args.Skip(3));

            _logger.Log($"Admin {message.From.Id} editing user {userId}, field: {field}, value: {value}");

            try
            {
                // Get the user first to verify they exist
                var user = await _mongoDb.GetUserByIdAsync(userId);
                if (user == null)
                {
                    await _botClient.SendTextMessageAsync(
                        chatId: message.Chat.Id,
                        text: $"User with ID {userId} not found.",
                        cancellationToken: cancellationToken
                    );
                    return;
                }

                bool success = false;
                string responseMessage = "";

                switch (field)
                {
                    case "bricks":
                        if (int.TryParse(value, out int bricksValue))
                        {
                            success = await _mongoDb.UpdateUserBricksAsync(userId, bricksValue);
                            responseMessage = $"Updated user's Bricks to {bricksValue}.";
                        }
                        else
                        {
                            responseMessage = "Invalid Bricks value. Please enter a number.";
                        }
                        break;

                    case "admin":
                        if (bool.TryParse(value, out bool adminValue))
                        {
                            success = adminValue ? 
                                await _mongoDb.SetUserAsAdminAsync(userId) : 
                                await _mongoDb.RemoveUserAdminStatusAsync(userId);
                            responseMessage = $"Set user's admin status to {adminValue}.";
                        }
                        else
                        {
                            responseMessage = "Invalid admin value. Please use 'true' or 'false'.";
                        }
                        break;

                    case "ban":
                        if (bool.TryParse(value, out bool banValue))
                        {
                            success = banValue ? 
                                await _mongoDb.BanUserAsync(userId) : 
                                await _mongoDb.UnbanUserAsync(userId);
                            responseMessage = $"Set user's ban status to {banValue}.";
                        }
                        else
                        {
                            responseMessage = "Invalid ban value. Please use 'true' or 'false'.";
                        }
                        break;

                    case "username":
                        success = await _mongoDb.UpdateUserUsernameAsync(userId, value);
                        responseMessage = $"Updated user's username to {value}.";
                        break;

                    case "email":
                        success = await _mongoDb.UpdateUserEmailAsync(userId, value);
                        responseMessage = $"Updated user's email to {value}.";
                        break;

                    default:
                        responseMessage = $"Unknown field '{field}'. Available fields: bricks, admin, ban, username, email.";
                        break;
                }

                // Get updated user data
                var updatedUser = await _mongoDb.GetUserByIdAsync(userId);
                string statusEmoji = success ? "✅" : "⚠️";

                var sb = new StringBuilder();
                sb.AppendLine($"{statusEmoji} {responseMessage}\n");
                sb.AppendLine("*Updated User Info:*");
                sb.AppendLine($"*ID:* `{updatedUser.TelegramId}`");
                sb.AppendLine($"*Username:* {(string.IsNullOrEmpty(updatedUser.Username) ? "Not set" : "@" + updatedUser.Username)}");
                sb.AppendLine($"*Name:* {updatedUser.FirstName} {updatedUser.LastName}");
                sb.AppendLine($"*Bricks:* {updatedUser.BricksTotal}");
                sb.AppendLine($"*Admin:* {updatedUser.IsAdmin}");
                sb.AppendLine($"*Banned:* {updatedUser.IsBanned}");
                sb.AppendLine($"*Email:* {updatedUser.Email ?? "Not set"}");

                await _botClient.SendTextMessageAsync(
                    chatId: message.Chat.Id,
                    text: sb.ToString(),
                    parseMode: Telegram.Bot.Types.Enums.ParseMode.Markdown,
                    cancellationToken: cancellationToken
                );
            }
            catch (Exception ex)
            {
                _logger.Log($"Error editing user: {ex.Message}");
                await _botClient.SendTextMessageAsync(
                    chatId: message.Chat.Id,
                    text: $"Error editing user: {ex.Message}",
                    cancellationToken: cancellationToken
                );
            }
        }

        /// <summary>
        /// Handles the /FindMemberID command to find a user's Telegram ID by username
        /// </summary>
        public async Task HandleFindMemberIDCommandAsync(Message message, CancellationToken cancellationToken)
        {
            if (!await IsAdmin(message))
            {
                await _botClient.SendTextMessageAsync(
                    chatId: message.Chat.Id,
                    text: "This command is for admins only.",
                    cancellationToken: cancellationToken
                );
                return;
            }

            string[] args = message.Text.Split(' ');
            if (args.Length != 2)
            {
                await _botClient.SendTextMessageAsync(
                    chatId: message.Chat.Id,
                    text: "Usage: /FindMemberID @username or /FindMemberID username",
                    cancellationToken: cancellationToken
                );
                return;
            }

            string username = args[1].TrimStart('@');
            _logger.Log($"Admin {message.From.Id} searching for user with username: {username}");

            try
            {
                var users = await _mongoDb.GetAllUsersAsync();
                var matchingUsers = users.Where(u => 
                    u.Username?.ToLower() == username.ToLower() || 
                    (u.FirstName?.ToLower()?.Contains(username.ToLower()) ?? false) ||
                    (u.LastName?.ToLower()?.Contains(username.ToLower()) ?? false)).ToList();

                if (matchingUsers.Count == 0)
                {
                    await _botClient.SendTextMessageAsync(
                        chatId: message.Chat.Id,
                        text: $"No users found with username or name containing '{username}'.",
                        cancellationToken: cancellationToken
                    );
                    return;
                }

                var sb = new StringBuilder();
                sb.AppendLine($"🔍 *Search Results for '{username}'* 🔍\n");

                foreach (var user in matchingUsers)
                {
                    sb.AppendLine($"*ID:* `{user.TelegramId}`");
                    sb.AppendLine($"*Username:* {(string.IsNullOrEmpty(user.Username) ? "Not set" : "@" + user.Username)}");
                    sb.AppendLine($"*Name:* {user.FirstName} {user.LastName}");
                    sb.AppendLine($"*Bricks:* {user.BricksTotal}");
                    sb.AppendLine($"*Joined:* {user.CreatedAt:yyyy-MM-dd}\n");
                }

                await _botClient.SendTextMessageAsync(
                    chatId: message.Chat.Id,
                    text: sb.ToString(),
                    parseMode: Telegram.Bot.Types.Enums.ParseMode.Markdown,
                    cancellationToken: cancellationToken
                );
            }
            catch (Exception ex)
            {
                _logger.Log($"Error finding member ID: {ex.Message}");
                await _botClient.SendTextMessageAsync(
                    chatId: message.Chat.Id,
                    text: $"Error searching for user: {ex.Message}",
                    cancellationToken: cancellationToken
                );
            }
        }

        /// <summary>
        /// Handles the /adminMenu command to show the admin dashboard
        /// </summary>
        public async Task HandleAdminMenuCommandAsync(Message message, CancellationToken cancellationToken)
        {
            if (message.From == null) return;
            
            string userId = message.From.Id.ToString();
            var user = await _mongoDb.GetUserByIdAsync(userId);
            
            Console.WriteLine($"[DEBUG] Admin menu requested by user {userId}, IsAdmin: {(user?.IsAdmin == true)}");
            
            if (user?.IsAdmin != true)
            {
                await _botClient.SendTextMessageAsync(
                    chatId: message.Chat.Id,
                    text: "This command is for admins only.",
                    cancellationToken: cancellationToken
                );
                return;
            }
            
            await HandleAdminMenuCommandAsync(message.Chat.Id, cancellationToken);
        }
        
        /// <summary>
        /// Shows the admin dashboard with interactive buttons
        /// </summary>
        private async Task HandleAdminMenuCommandAsync(long chatId, CancellationToken cancellationToken)
        {
            Console.WriteLine($"[DEBUG] Showing admin dashboard to chat {chatId}");
            
            // Create the main menu with categories
            var mainMenuButtons = new[]
            {
                new[] { InlineKeyboardButton.WithCallbackData("👥 User Management", "admin_category_users") },
                new[] { InlineKeyboardButton.WithCallbackData("⚙️ Group Settings", "admin_category_settings") },
                new[] { InlineKeyboardButton.WithCallbackData("📊 Statistics", "admin_category_stats") }
            };

            string adminWelcomeMessage = "🔐 *Admin Dashboard* 🔐\n\n" +
                                      "Welcome to the admin control panel. Use the buttons below to access admin functions.\n\n" +
                                      "Available admin commands:\n" +
                                      "• /listAll - Full list of all members with points\n" +
                                      "• /FindMemberID - Find a user's ID by username\n" +
                                      "• /editUser - Edit user data";

            await _botClient.SendTextMessageAsync(
                chatId: chatId,
                text: adminWelcomeMessage,
                parseMode: Telegram.Bot.Types.Enums.ParseMode.Markdown,
                replyMarkup: new InlineKeyboardMarkup(mainMenuButtons),
                cancellationToken: cancellationToken
            );
        }
        
        /// <summary>
        /// Sends the admin dashboard with interactive buttons for admin commands
        /// </summary>
        private async Task SendAdminHelpAsync(long chatId, CancellationToken cancellationToken)
        {
            Console.WriteLine($"[DEBUG] Sending admin dashboard to chat {chatId}");
            string adminWelcomeMessage = "🔐 *Admin Dashboard* 🔐\n\n" +
                                      "Welcome to the admin control panel. Use the buttons below to access admin functions.\n\n" +
                                      "You can also type these commands directly:\n" +
                                      "• /listAll - Full list of all members with points\n" +
                                      "• /FindMemberID - Find a user's ID by username\n" +
                                      "• /editUser - Edit user data";

            // Create inline keyboard with admin command buttons
            var userManagementButtons = new[]
            {
                new[]
                {
                    InlineKeyboardButton.WithCallbackData("📋 List All Members", "admin_listAll"),
                    InlineKeyboardButton.WithCallbackData("🔍 Find Member ID", "admin_findMember")
                },
                new[]
                {
                    InlineKeyboardButton.WithCallbackData("✏️ Edit User", "admin_editUser"),
                    InlineKeyboardButton.WithCallbackData("🚫 Ban User", "admin_ban")
                }
            };

            var groupSettingsButtons = new[]
            {
                new[]
                {
                    InlineKeyboardButton.WithCallbackData("🔕 Disable Welcome", "admin_disableWelcome"),
                    InlineKeyboardButton.WithCallbackData("🔔 Enable Welcome", "admin_enableWelcome")
                }
            };

            var statsButtons = new[]
            {
                new[]
                {
                    InlineKeyboardButton.WithCallbackData("📊 Referral Stats", "admin_refTotal"),
                    InlineKeyboardButton.WithCallbackData("📈 Activity Stats", "admin_activityStats")
                }
            };

            // Create the main menu with categories
            var mainMenuButtons = new[]
            {
                new[] { InlineKeyboardButton.WithCallbackData("👥 User Management", "admin_category_users") },
                new[] { InlineKeyboardButton.WithCallbackData("⚙️ Group Settings", "admin_category_settings") },
                new[] { InlineKeyboardButton.WithCallbackData("📊 Statistics", "admin_category_stats") }
            };

            // Send the welcome message with the main menu
            await _botClient.SendTextMessageAsync(
                chatId: chatId,
                text: adminWelcomeMessage,
                parseMode: Telegram.Bot.Types.Enums.ParseMode.Markdown,
                replyMarkup: new InlineKeyboardMarkup(mainMenuButtons),
                cancellationToken: cancellationToken
            );
        }

        /// <summary>
        /// Handles admin dashboard button callbacks
        /// </summary>
        public async Task HandleAdminCallbackAsync(CallbackQuery callbackQuery, CancellationToken cancellationToken)
        {
            var chatId = callbackQuery.Message.Chat.Id;
            var userId = callbackQuery.From.Id.ToString();
            var data = callbackQuery.Data;

            // Verify the user is an admin
            var user = await _mongoDb.GetUserByIdAsync(userId);
            Console.WriteLine($"[DEBUG] Admin callback from user {userId}, IsAdmin: {(user?.IsAdmin == true)}");
            
            if (user == null || !user.IsAdmin)
            {
                await _botClient.AnswerCallbackQueryAsync(
                    callbackQueryId: callbackQuery.Id,
                    text: "You don't have admin privileges.",
                    showAlert: true,
                    cancellationToken: cancellationToken
                );
                return;
            }

            // Answer the callback query to remove the loading indicator
            await _botClient.AnswerCallbackQueryAsync(
                callbackQueryId: callbackQuery.Id,
                cancellationToken: cancellationToken
            );

            // Handle category selections
            if (data.StartsWith("admin_category_"))
            {
                var category = data.Replace("admin_category_", "");
                InlineKeyboardMarkup markup = null;

                switch (category)
                {
                    case "users":
                        markup = new InlineKeyboardMarkup(new[]
                        {
                            new[]
                            {
                                InlineKeyboardButton.WithCallbackData("📋 List All Members", "admin_listAll"),
                                InlineKeyboardButton.WithCallbackData("🔍 Find Member ID", "admin_findMember")
                            },
                            new[]
                            {
                                InlineKeyboardButton.WithCallbackData("✏️ Edit User", "admin_editUser"),
                                InlineKeyboardButton.WithCallbackData("🚫 Ban User", "admin_ban")
                            },
                            new[] { InlineKeyboardButton.WithCallbackData("🔙 Back to Main Menu", "admin_main_menu") }
                        });
                        await _botClient.EditMessageTextAsync(
                            chatId: chatId,
                            messageId: callbackQuery.Message.MessageId,
                            text: "🔐 *User Management* 🔐\n\nSelect a user management function:",
                            parseMode: Telegram.Bot.Types.Enums.ParseMode.Markdown,
                            replyMarkup: markup,
                            cancellationToken: cancellationToken
                        );
                        break;

                    case "settings":
                        markup = new InlineKeyboardMarkup(new[]
                        {
                            new[]
                            {
                                InlineKeyboardButton.WithCallbackData("🔕 Disable Welcome", "admin_disableWelcome"),
                                InlineKeyboardButton.WithCallbackData("🔔 Enable Welcome", "admin_enableWelcome")
                            },
                            new[] { InlineKeyboardButton.WithCallbackData("🔙 Back to Main Menu", "admin_main_menu") }
                        });
                        await _botClient.EditMessageTextAsync(
                            chatId: chatId,
                            messageId: callbackQuery.Message.MessageId,
                            text: "🔐 *Group Settings* 🔐\n\nSelect a group setting to modify:",
                            parseMode: Telegram.Bot.Types.Enums.ParseMode.Markdown,
                            replyMarkup: markup,
                            cancellationToken: cancellationToken
                        );
                        break;

                    case "stats":
                        markup = new InlineKeyboardMarkup(new[]
                        {
                            new[]
                            {
                                InlineKeyboardButton.WithCallbackData("📊 Referral Stats", "admin_refTotal"),
                                InlineKeyboardButton.WithCallbackData("📈 Activity Stats", "admin_activityStats")
                            },
                            new[] { InlineKeyboardButton.WithCallbackData("🔙 Back to Main Menu", "admin_main_menu") }
                        });
                        await _botClient.EditMessageTextAsync(
                            chatId: chatId,
                            messageId: callbackQuery.Message.MessageId,
                            text: "🔐 *Statistics* 🔐\n\nSelect a statistics view:",
                            parseMode: Telegram.Bot.Types.Enums.ParseMode.Markdown,
                            replyMarkup: markup,
                            cancellationToken: cancellationToken
                        );
                        break;
                }
                return;
            }

            // Handle the back button
            if (data == "admin_main_menu")
            {
                var mainMenuButtons = new[]
                {
                    new[] { InlineKeyboardButton.WithCallbackData("👥 User Management", "admin_category_users") },
                    new[] { InlineKeyboardButton.WithCallbackData("⚙️ Group Settings", "admin_category_settings") },
                    new[] { InlineKeyboardButton.WithCallbackData("📊 Statistics", "admin_category_stats") }
                };

                await _botClient.EditMessageTextAsync(
                    chatId: chatId,
                    messageId: callbackQuery.Message.MessageId,
                    text: "🔐 *Admin Dashboard* 🔐\n\n" +
                          "Welcome to the admin control panel. Use the buttons below to access admin functions.\n\n" +
                          "You can also type these commands directly:\n" +
                          "• /listAll - Full list of all members with points\n" +
                          "• /FindMemberID - Find a user's ID by username\n" +
                          "• /editUser - Edit user data",
                    parseMode: Telegram.Bot.Types.Enums.ParseMode.Markdown,
                    replyMarkup: new InlineKeyboardMarkup(mainMenuButtons),
                    cancellationToken: cancellationToken
                );
                return;
            }

            // Handle specific admin commands
            if (data.StartsWith("admin_"))
            {
                string command = data.Replace("admin_", "");
                
                // Create a fake message to pass to the appropriate handler
                var message = new Message
                {
                    MessageId = callbackQuery.Message.MessageId,
                    From = callbackQuery.From,
                    Chat = callbackQuery.Message.Chat,
                    Date = DateTime.UtcNow
                };

                switch (command)
                {
                    case "listAll":
                        await ListAllMembersAsync(message, cancellationToken);
                        break;
                        
                    case "findMember":
                        await _botClient.SendTextMessageAsync(
                            chatId: chatId,
                            text: "Please enter the username to search for using the format: /FindMemberID @username",
                            cancellationToken: cancellationToken
                        );
                        break;
                        
                    case "editUser":
                        await _botClient.SendTextMessageAsync(
                            chatId: chatId,
                            text: "Please enter the user ID and field to edit using the format: /editUser [userId] [field] [value]\n\n" +
                                  "Available fields: bricks, admin, ban, username, email",
                            cancellationToken: cancellationToken
                        );
                        break;
                        
                    case "ban":
                        await _botClient.SendTextMessageAsync(
                            chatId: chatId,
                            text: "Please enter the username to ban using the format: /ban @username",
                            cancellationToken: cancellationToken
                        );
                        break;
                        
                    case "refTotal":
                        // Implement referral stats command
                        await _botClient.SendTextMessageAsync(
                            chatId: chatId,
                            text: "Referral statistics feature is coming soon.",
                            cancellationToken: cancellationToken
                        );
                        break;
                        
                    case "activityStats":
                        // Implement activity stats command
                        await _botClient.SendTextMessageAsync(
                            chatId: chatId,
                            text: "Activity statistics feature is coming soon.",
                            cancellationToken: cancellationToken
                        );
                        break;
                        
                    case "disableWelcome":
                        // Implement disable welcome command
                        await _botClient.SendTextMessageAsync(
                            chatId: chatId,
                            text: "Welcome messages have been disabled.",
                            cancellationToken: cancellationToken
                        );
                        break;
                        
                    case "enableWelcome":
                        // Implement enable welcome command
                        await _botClient.SendTextMessageAsync(
                            chatId: chatId,
                            text: "Welcome messages have been enabled.",
                            cancellationToken: cancellationToken
                        );
                        break;
                }
            }
        }
    }
}
