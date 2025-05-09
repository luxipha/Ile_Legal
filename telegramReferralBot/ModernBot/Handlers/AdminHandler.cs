using System;
using System.Threading;
using System.Threading.Tasks;
using System.Text;
using Telegram.Bot;
using Telegram.Bot.Types;
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

            var admins = await _botClient.GetChatAdministratorsAsync(message.Chat.Id);
            return admins.Any(admin => admin.User.Id == message.From.Id);
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
            // Get admin password from environment variable
            string adminPassword = Environment.GetEnvironmentVariable("ADMIN_PASSWORD") ?? "";
            
            if (string.IsNullOrEmpty(adminPassword))
            {
                _logger.Log("ADMIN_PASSWORD environment variable is not set");
                await _botClient.SendTextMessageAsync(
                    chatId: chatId,
                    text: "Admin authentication is not configured. Please contact the bot administrator.",
                    cancellationToken: cancellationToken
                );
                return;
            }

            if (password == adminPassword)
            {
                // Password is correct, set user as admin
                bool success = await _mongoDb.SetUserAsAdminAsync(userId);
                
                if (success)
                {
                    await _botClient.SendTextMessageAsync(
                        chatId: chatId,
                        text: "✅ Admin authentication successful! You now have admin privileges.",
                        cancellationToken: cancellationToken
                    );
                    
                    // Send admin commands help
                    await SendAdminHelpAsync(chatId, cancellationToken);
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
        /// Sends the admin help message with available admin commands
        /// </summary>
        private async Task SendAdminHelpAsync(long chatId, CancellationToken cancellationToken)
        {
            string adminHelpMessage = "🔐 *Admin Commands* 🔐\n\n" +
                                    "Private Chat Commands:\n" +
                                    "• /listAll - Full list of all members with points\n" +
                                    "• /ban - Ban a user from the referral program\n" +
                                    "• /FindMemberID - Find a user's Telegram ID by username\n" +
                                    "• /editUser - Edit user data\n\n" +
                                    "Group Chat Commands:\n" +
                                    "• /disableWelcome - Disable welcome messages\n" +
                                    "• /enableWelcome - Enable welcome messages\n\n" +
                                    "Statistics Commands:\n" +
                                    "• /refTotal - Show referrals per day\n";

            await _botClient.SendTextMessageAsync(
                chatId: chatId,
                text: adminHelpMessage,
                parseMode: Telegram.Bot.Types.Enums.ParseMode.Markdown,
                cancellationToken: cancellationToken
            );
        }
    }
}
