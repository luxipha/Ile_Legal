using System;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using Telegram.Bot;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;
using TelegramReferralBot.Services;
using TelegramReferralBot.Utils;

namespace TelegramReferralBot.Handlers
{
    public class LeaderboardHandler
    {
        private readonly ITelegramBotClient _botClient;
        private readonly MongoDbService _mongoDb;
        private readonly IBotLogger _logger;

        public LeaderboardHandler(
            ITelegramBotClient botClient,
            MongoDbService mongoDb,
            ILogger logger)
        {
            _botClient = botClient;
            _mongoDb = mongoDb;
            _logger = new LoggerAdapter(logger);
        }

        /// <summary>
        /// Sends the leaderboard showing top referrers
        /// </summary>
        public async Task SendLeaderboardAsync(Message message, CancellationToken cancellationToken)
        {
            try
            {
                var sb = new StringBuilder();
                sb.AppendLine("🏆 *Top Referrers* 🏆\n");

                var users = await _mongoDb.GetAllUsersAsync();
                var leaderboard = users
                    .Select(u => new { UserId = u.TelegramId, ReferralCount = u.ReferralsCount })
                    .Where(u => u.ReferralCount > 0)
                    .OrderByDescending(u => u.ReferralCount)
                    .Take(10);

                int rank = 1;
                foreach (var entry in leaderboard)
                {
                    string username = await GetUsernameAsync(entry.UserId);
                    string medal = rank switch
                    {
                        1 => "🥇",
                        2 => "🥈",
                        3 => "🥉",
                        _ => "  "
                    };
                    sb.AppendLine($"{medal}{rank}. {username}: {entry.ReferralCount} referrals");
                    rank++;
                }

                if (rank == 1)
                {
                    sb.AppendLine("\nNo referrals yet! Be the first to refer someone!");
                }

                await _botClient.SendTextMessageAsync(
                    chatId: message.Chat.Id,
                    text: sb.ToString(),
                    parseMode: ParseMode.Markdown,
                    cancellationToken: cancellationToken
                );
            }
            catch (Exception ex)
            {
                _logger.Log($"Error sending leaderboard: {ex.Message}");
            }
        }

        /// <summary>
        /// Sends the Bricks Journey Map
        /// </summary>
        public async Task SendBricksJourneyMapAsync(Message message, CancellationToken cancellationToken)
        {
            string journeyMap =
                "🧱 *Ilé Bricks Journey Map* 🧱\n\n" +
                "*Stage 1: Welcome Explorer (0–500 Bricks)*\n\n" +
                "✅ Bind Email → +50\n" +
                $"✅ Join Telegram → +{Config.JoinReward}\n" +
                "✅ First Check-in → +10\n" +
                "→ You're now part of the community!\n\n" +

                "*Stage 2: Active Citizen (500–2,000 Bricks)*\n\n" +
                "🔥 Daily Check-In → +10/day\n" +
                $"🔥 Group Activity → +5/message (Cap: {Config.MaxPointsPerDay}/day)\n" +
                $"🔥 First 3 Referrals → +{Config.ReferralReward * 3} ({Config.ReferralReward} each)\n" +
                "→ You're building your foundation!\n\n" +

                "*Stage 3: Community Builder (2,000–5,000 Bricks)*\n\n" +
                "🛡️ 5+ Referrals → +500\n" +
                $"🛡️ 7-Day Streak → +{Config.StreakReward}\n" +
                $"🛡️ Win Daily Leaderboard → +{Config.LeaderboardReward}\n" +
                "→ You're now a trusted member. Badge unlocked!\n\n" +

                "*Stage 4: Contributor (5,000–10,000 Bricks)*\n\n" +
                "🧠 Submit helpful content → +1,000\n" +
                "🧠 Join Feedback Round → +500\n" +
                "🧠 Refer 10th user → +1,000\n" +
                "→ You're shaping the culture here!\n\n" +

                "*Stage 5: Influencer (10,000–20,000 Bricks)*\n\n" +
                "📢 Host a space/event → +2,000\n" +
                "📢 Write Bricks Thread → +1,500\n" +
                "📢 Top 10 in Leaderboard 3x → +2,500\n" +
                "→ You're making waves. Keep going!\n\n" +

                "*Stage 6: Partner (20,000–35,000 Bricks)*\n\n" +
                "🤝 Onboard a community → +5,000\n" +
                "🤝 Moderate a Subgroup → +3,000\n" +
                "🤝 Consistent 30-day Check-in → +5,000\n" +
                "→ You're now a Bricks ally.\n\n" +

                "*Stage 7: Ambassador (35,000–60,000 Bricks)*\n\n" +
                "🏆 Host a 100+ attendee event → +10,000\n" +
                "🏆 Nominate other leaders → +5,000\n" +
                "🏆 20+ total referrals → +5,000\n" +
                "→ You've got real influence. Badge unlocked.\n\n" +

                "*Stage 8: Luminary (60,000–100,000 Bricks)*\n\n" +
                "✨ Partner on a Bricks campaign → +15,000\n" +
                "✨ Author an official guide → +10,000\n" +
                "✨ Lead mentorship circle → +15,000\n" +
                "→ You're a beacon for others.\n\n" +

                "*Stage 9: Legend (100,000–250,000 Bricks)*\n\n" +
                "🔥 Earn community votes → Bricks bonus\n" +
                "🔥 Help Bricks form partnerships → +25k–50k\n" +
                "🔥 Annual contributor award → +50k\n" +
                "→ You're a legacy-maker.\n\n" +

                "*Stage 10: Hall of Flame (250,000–500,000 Bricks)*\n\n" +
                "🪙 Voted into Hall by peers\n" +
                "🪙 Lifetime impact recognition\n" +
                "🪙 Special IRL + digital perks\n" +
                "→ You're eternalized in Bricks history.";

            await _botClient.SendTextMessageAsync(
                chatId: message.Chat.Id,
                text: journeyMap,
                parseMode: ParseMode.Markdown,
                cancellationToken: cancellationToken
            );
        }

        /// <summary>
        /// Lists all members with their referral counts
        /// </summary>
        public async Task ListReferralsAsync(Message message, CancellationToken cancellationToken)
        {
            try
            {
                var sb = new StringBuilder();
                sb.AppendLine("📊 *All Members Referral Stats* 📊\n");

                var users = await _mongoDb.GetAllUsersAsync();
                var sortedMembers = users
                    .Select(u => new { UserId = u.TelegramId, ReferralCount = u.ReferralsCount })
                    .Where(u => u.ReferralCount > 0)
                    .OrderByDescending(u => u.ReferralCount);

                int rank = 1;
                foreach (var member in sortedMembers)
                {
                    string username = await GetUsernameAsync(member.UserId);
                    sb.AppendLine($"{rank}. {username}: {member.ReferralCount} referrals");
                    rank++;
                }

                if (rank == 1)
                {
                    sb.AppendLine("\nNo referrals yet!");
                }

                await _botClient.SendTextMessageAsync(
                    chatId: message.Chat.Id,
                    text: sb.ToString(),
                    parseMode: ParseMode.Markdown,
                    cancellationToken: cancellationToken
                );
            }
            catch (Exception ex)
            {
                _logger.Log($"Error listing referrals: {ex.Message}");
            }
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
    }
}
