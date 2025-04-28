using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Newtonsoft.Json;
using Telegram.Bot.Types;
using Polly;
using Polly.Retry;
using Polly.Extensions.Http;
using System.Net;
using System.Security.Authentication;

namespace TelegramReferralBot;

/// <summary>
/// Handles integration with the main Ile backend API
/// </summary>
public static class ApiIntegration
{
    private static readonly HttpClient _httpClient;
    private static readonly string _apiBaseUrl = Environment.GetEnvironmentVariable("BACKEND_URL") ?? "http://localhost:3000"; // Use environment variable with fallback
    private static readonly string _apiKey = Environment.GetEnvironmentVariable("BOT_API_KEY") ?? "your-secure-api-key-here"; // Use environment variable with fallback
    private static readonly AsyncRetryPolicy<HttpResponseMessage> _retryPolicy;
    
    static ApiIntegration()
    {
        // Create a retry policy with exponential backoff
        _retryPolicy = Policy
            .Handle<HttpRequestException>()
            .Or<TaskCanceledException>() // This handles timeouts
            .Or<TimeoutException>()
            .OrResult<HttpResponseMessage>(r => !r.IsSuccessStatusCode) // Also retry on non-success status codes
            .WaitAndRetryAsync(
                5, // Number of retries
                retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)), // Exponential backoff
                onRetry: (outcome, timeSpan, retryCount, context) =>
                {
                    string message;
                    if (outcome.Exception != null)
                    {
                        message = $"API request attempt {retryCount} failed with {outcome.Exception.GetType().Name}: {outcome.Exception.Message}. Retrying in {timeSpan.TotalSeconds} seconds...";
                    }
                    else
                    {
                        message = $"API request attempt {retryCount} failed with status code {outcome.Result.StatusCode}. Retrying in {timeSpan.TotalSeconds} seconds...";
                    }
                    Logging.AddToLog(message);
                    Console.WriteLine(message);
                }
            );
        
        // Create HTTP client with increased timeout and modern TLS settings
        var handler = new HttpClientHandler
        {
            SslProtocols = SslProtocols.Tls12 | SslProtocols.Tls13,
            // In production, this should be set to true
            ServerCertificateCustomValidationCallback = (sender, cert, chain, sslPolicyErrors) => 
            {
                // For production, use this:
                // return sslPolicyErrors == SslPolicyErrors.None;
                
                // For development, we're allowing self-signed certificates:
                return true;
            }
        };
        
        _httpClient = new HttpClient(handler)
        {
            Timeout = TimeSpan.FromSeconds(30) // Increase timeout to 30 seconds
        };
        
        // Set up the HTTP client with the API key
        _httpClient.DefaultRequestHeaders.Add("x-api-key", _apiKey);
    }
    
    /// <summary>
    /// Syncs referral data with the main backend
    /// </summary>
    public static async Task SyncReferralsAsync()
    {
        try
        {
            // Prepare data to send
            var referrals = new List<object>();
            
            // Add referrals from the bot's data
            foreach (KeyValuePair<string, string> entry in Program.ReferredBy)
            {
                string referredId = entry.Key;
                string referrerId = entry.Value;
                
                // Get points earned if available
                int points = 0;
                if (Program.ReferralPoints.ContainsKey(referrerId))
                {
                    points = Program.ReferralPoints[referrerId];
                }
                
                referrals.Add(new {
                    referrerId = referrerId,
                    referredId = referredId,
                    points = Config.ReferralReward, // Use the configured referral reward
                    timestamp = DateTime.UtcNow.ToString("o"),
                    type = "referral"
                });
            }
            
            // Add group join events
            foreach (KeyValuePair<int, string> entry in Program.JoinedReferrals)
            {
                int userId = entry.Key;
                
                referrals.Add(new {
                    referrerId = userId.ToString(),
                    referredId = userId.ToString(), // Self-referential for join events
                    points = Config.JoinReward, // Use the configured join reward
                    timestamp = DateTime.UtcNow.ToString("o"),
                    type = "join_group"
                });
            }
            
            // Add group activity points
            foreach (KeyValuePair<string, Dictionary<string, int>> userActivity in Program.UserActivity)
            {
                string userId = userActivity.Key;
                
                foreach (KeyValuePair<string, int> dailyActivity in userActivity.Value)
                {
                    // Only sync today's activity
                    if (dailyActivity.Key == DateTime.UtcNow.ToString("MM/dd/yyyy"))
                    {
                        referrals.Add(new {
                            referrerId = userId,
                            referredId = userId, // Self-referential for activity
                            points = Math.Min(dailyActivity.Value, Config.MaxPointsPerDay), // Cap at max points per day
                            timestamp = DateTime.UtcNow.ToString("o"),
                            type = "group_activity"
                        });
                    }
                }
            }
            
            // Add streak rewards
            // This would require tracking streaks in the ModernBot
            // For now, we'll leave this as a placeholder
            
            // Add leaderboard rewards
            // This would require implementing leaderboard functionality
            // For now, we'll leave this as a placeholder
            
            // Create request content
            var content = new StringContent(
                JsonConvert.SerializeObject(new { referrals = referrals }),
                Encoding.UTF8,
                "application/json"
            );
            
            // Send to main system with retry policy
            var response = await _retryPolicy.ExecuteAsync(async () => 
                await _httpClient.PostAsync($"{_apiBaseUrl}/bot-integration/sync-referrals", content)
            );
            
            // Log result
            string responseContent = await response.Content.ReadAsStringAsync();
            Logging.AddToLog("Sync result: " + responseContent);
            Console.WriteLine("Sync result: " + responseContent);
            
            if (response.IsSuccessStatusCode)
            {
                Console.WriteLine("Successfully synced data with main backend");
            }
            else
            {
                Console.WriteLine($"Error syncing data: {response.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            Logging.AddToLog("Error syncing referrals: " + ex.Message);
            Console.WriteLine("Error syncing referrals: " + ex.Message);
        }
    }
    
    /// <summary>
    /// Gets user data from the main backend
    /// </summary>
    public static async Task<UserData?> GetUserDataAsync(string telegramId)
    {
        try
        {
            // Use retry policy for the API call
            var response = await _retryPolicy.ExecuteAsync(async () =>
                await _httpClient.GetAsync($"{_apiBaseUrl}/bot-integration/users/{telegramId}")
            );
            
            if (response.IsSuccessStatusCode)
            {
                string responseContent = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<ApiResponse<UserData>>(responseContent);
                
                if (result?.Success == true)
                {
                    return result.User;
                }
            }
            
            return null;
        }
        catch (Exception ex)
        {
            Logging.AddToLog("Error getting user data: " + ex.Message);
            Console.WriteLine("Error getting user data: " + ex.Message);
            return null;
        }
    }
    
    /// <summary>
    /// Gets user points from the main backend
    /// </summary>
    public static async Task<PointsData?> GetUserPointsAsync(string telegramId)
    {
        try
        {
            // Use retry policy for the API call
            var response = await _retryPolicy.ExecuteAsync(async () =>
                await _httpClient.GetAsync($"{_apiBaseUrl}/bot-integration/points/{telegramId}")
            );
            
            if (response.IsSuccessStatusCode)
            {
                string responseContent = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<ApiResponse<PointsData>>(responseContent);
                
                if (result?.Success == true)
                {
                    return result.Points;
                }
            }
            
            return null;
        }
        catch (Exception ex)
        {
            Logging.AddToLog("Error getting user points: " + ex.Message);
            Console.WriteLine("Error getting user points: " + ex.Message);
            return null;
        }
    }
}

/// <summary>
/// User data from the main backend
/// </summary>
public class UserData
{
    public string? TelegramId { get; set; }
    public string? ReferralCode { get; set; }
    public int BricksTotal { get; set; }
    public bool IsOnboarded { get; set; }
    public int ReferralsCount { get; set; }
}

/// <summary>
/// Points data from the main backend
/// </summary>
public class PointsData
{
    public int Total { get; set; }
    public int Referrals { get; set; }
    public double Accumulated { get; set; }
}

/// <summary>
/// API response wrapper
/// </summary>
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? User { get; set; }
    public T? Points { get; set; }
}
