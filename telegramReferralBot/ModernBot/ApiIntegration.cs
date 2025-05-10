using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Net;
using TelegramReferralBot.Utils;
using Polly;
using Polly.Retry;
using Polly.Extensions.Http;
using System.Security.Authentication;
using System.IO;
using Newtonsoft.Json;


namespace TelegramReferralBot;

/// <summary>
/// Handles integration with the main Ile backend API
/// </summary>
public static class ApiIntegration
{
    private static readonly HttpClient _httpClient;
    private static readonly string _apiBaseUrl = Environment.GetEnvironmentVariable("BACKEND_URL") ?? "http://localhost:3000"; // Use Render backend server
    private static readonly string _apiKey;
    private static readonly AsyncRetryPolicy<HttpResponseMessage> _retryPolicy;
    
    static ApiIntegration()
    {
        // Load API key from config.conf if available
        string configApiKey = LoadApiKeyFromConfig();
        _apiKey = Environment.GetEnvironmentVariable("BOT_API_KEY") ?? configApiKey ?? "your-secure-api-key-here";
        
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
            // For production, this should be set to true for proper certificate validation
            ServerCertificateCustomValidationCallback = (sender, cert, chain, sslPolicyErrors) =>
            {
                // For development, we're allowing self-signed certificates:
                return true;
            }
        };
        
        _httpClient = new HttpClient(handler)
        {
            Timeout = TimeSpan.FromSeconds(30) // Increase timeout to 30 seconds
        };
        
        // Debug: Log the API key being used (mask most of it for security)
        string maskedApiKey = _apiKey.Length > 8 
            ? _apiKey.Substring(0, 4) + "..." + _apiKey.Substring(_apiKey.Length - 4) 
            : "Invalid API Key";
        Logging.AddToLog($"Using API key: {maskedApiKey}");
        Console.WriteLine($"Using API key: {maskedApiKey}");
        
        // Set up the HTTP client with the API key
        _httpClient.DefaultRequestHeaders.Add("x-api-key", _apiKey);
        
        // Debug: Log all headers being sent
        Logging.AddToLog("HTTP Headers being sent:");
        foreach (var header in _httpClient.DefaultRequestHeaders)
        {
            Logging.AddToLog($"  {header.Key}: {string.Join(", ", header.Value)}");
            Console.WriteLine($"  {header.Key}: {string.Join(", ", header.Value)}");
        }
    }
    
    /// <summary>
    /// Syncs referral data with the main backend
    /// </summary>
    public static async Task SyncReferralsAsync()
    {
        try
        {
            // Always use the Render backend URL for sync operations
            string renderBackendUrl = "https://ile-backend.onrender.com";
            
            // Debug: Log the base URL being used
            Logging.AddToLog($"Using API base URL: {renderBackendUrl}");
            Console.WriteLine($"Using API base URL: {renderBackendUrl}");
            
            // Ensure the base URL is properly formatted
            if (!renderBackendUrl.StartsWith("http://") && !renderBackendUrl.StartsWith("https://"))
            {
                Logging.AddToLog($"Invalid base URL format: {renderBackendUrl}. Must start with http:// or https://");
                Console.WriteLine($"Invalid base URL format: {renderBackendUrl}. Must start with http:// or https://");
                return;
            }
            
            // Remove any trailing slash to avoid double slashes in the URL
            string baseUrl = renderBackendUrl.TrimEnd('/');
            string fullUrl = $"{baseUrl}/bot-integration/sync-referrals";
            
            // Debug: Log the full URL being used
            Logging.AddToLog($"Making API request to: {fullUrl}");
            Console.WriteLine($"Making API request to: {fullUrl}");
            
            // Prepare data to send
            var referrals = new List<object>();
            
            // Add referrals from the bot's data
            foreach (KeyValuePair<string, string> entry in State.ReferredBy)
            {
                string referredId = entry.Key;
                string referrerId = entry.Value;
                
                // Get points earned if available
                int points = 0;
                if (State.ReferralPoints.ContainsKey(referrerId))
                {
                    points = State.ReferralPoints[referrerId];
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
            foreach (KeyValuePair<string, bool> entry in State.JoinedReferrals)
            {
                string userId = entry.Key;
                bool joined = entry.Value;
                
                // Skip entries that aren't joined
                if (!joined) continue;
                
                referrals.Add(new {
                    referrerId = userId,
                    referredId = userId, // Self-referential for join events
                    points = Config.JoinReward, // Use the configured join reward
                    timestamp = DateTime.UtcNow.ToString("o"),
                    type = "join_group"
                });
            }
            
            // Add group activity points
            foreach (KeyValuePair<string, Dictionary<string, int>> userActivity in State.UserActivity)
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
            var jsonContent = JsonConvert.SerializeObject(new { referrals = referrals });
            var content = new StringContent(jsonContent, Encoding.UTF8);
            content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
            
            // Send to main system with retry policy
            var response = await _retryPolicy.ExecuteAsync(async () => 
                await _httpClient.PostAsync(fullUrl, content)
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
            // Debug: Log the base URL being used
            Logging.AddToLog($"Using API base URL: {_apiBaseUrl}");
            Console.WriteLine($"Using API base URL: {_apiBaseUrl}");
            
            // Ensure the base URL is properly formatted
            if (!_apiBaseUrl.StartsWith("http://") && !_apiBaseUrl.StartsWith("https://"))
            {
                Logging.AddToLog($"Invalid base URL format: {_apiBaseUrl}. Must start with http:// or https://");
                Console.WriteLine($"Invalid base URL format: {_apiBaseUrl}. Must start with http:// or https://");
                return null;
            }
            
            // Remove any trailing slash to avoid double slashes in the URL
            string baseUrl = _apiBaseUrl.TrimEnd('/');
            string fullUrl = $"{baseUrl}/bot-integration/users/{telegramId}";
            
            // Debug: Log the full URL being used
            Logging.AddToLog($"Making API request to: {fullUrl}");
            Console.WriteLine($"Making API request to: {fullUrl}");
            
            // Use retry policy for the API call
            var response = await _retryPolicy.ExecuteAsync(async () =>
                await _httpClient.GetAsync(fullUrl)
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
            // Debug: Log the base URL being used
            Logging.AddToLog($"Using API base URL: {_apiBaseUrl}");
            Console.WriteLine($"Using API base URL: {_apiBaseUrl}");
            
            // Ensure the base URL is properly formatted
            if (!_apiBaseUrl.StartsWith("http://") && !_apiBaseUrl.StartsWith("https://"))
            {
                Logging.AddToLog($"Invalid base URL format: {_apiBaseUrl}. Must start with http:// or https://");
                Console.WriteLine($"Invalid base URL format: {_apiBaseUrl}. Must start with http:// or https://");
                return null;
            }
            
            // Remove any trailing slash to avoid double slashes in the URL
            string baseUrl = _apiBaseUrl.TrimEnd('/');
            string fullUrl = $"{baseUrl}/bot-integration/points/{telegramId}";
            
            // Debug: Log the full URL being used
            Logging.AddToLog($"Making API request to: {fullUrl}");
            Console.WriteLine($"Making API request to: {fullUrl}");
            
            // Use retry policy for the API call
            var response = await _retryPolicy.ExecuteAsync(async () =>
                await _httpClient.GetAsync(fullUrl)
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
    
    /// <summary>
    /// Test the API connection and authentication
    /// </summary>
    public static async Task TestApiConnectionAsync()
    {
        try
        {
            // Debug: Log the base URL being used
            Logging.AddToLog($"TEST: Using API base URL: {_apiBaseUrl}");
            Console.WriteLine($"TEST: Using API base URL: {_apiBaseUrl}");
            
            // Debug: Log the API key being used (mask most of it for security)
            string maskedApiKey = _apiKey.Length > 8 
                ? _apiKey.Substring(0, 4) + "..." + _apiKey.Substring(_apiKey.Length - 4) 
                : "Invalid API Key";
            Logging.AddToLog($"TEST: Using API key: {maskedApiKey}");
            Console.WriteLine($"TEST: Using API key: {maskedApiKey}");
            
            // Ensure the base URL is properly formatted
            if (!_apiBaseUrl.StartsWith("http://") && !_apiBaseUrl.StartsWith("https://"))
            {
                Logging.AddToLog($"TEST: Invalid base URL format: {_apiBaseUrl}. Must start with http:// or https://");
                Console.WriteLine($"TEST: Invalid base URL format: {_apiBaseUrl}. Must start with http:// or https://");
                return;
            }
            
            // Remove any trailing slash to avoid double slashes in the URL
            string baseUrl = _apiBaseUrl.TrimEnd('/');
            
            // Try different endpoints to see which one works
            string[] testEndpoints = {
                "/bot-integration/health",
                "/health",
                "/",
                "/bot-integration"
            };
            
            foreach (var endpoint in testEndpoints)
            {
                string fullUrl = $"{baseUrl}{endpoint}";
                
                // Debug: Log the full URL being used
                Logging.AddToLog($"TEST: Making API request to: {fullUrl}");
                Console.WriteLine($"TEST: Making API request to: {fullUrl}");
                
                try
                {
                    // Make a simple GET request
                    var response = await _httpClient.GetAsync(fullUrl);
                    
                    // Log the result
                    Logging.AddToLog($"TEST: Response status: {response.StatusCode}");
                    Console.WriteLine($"TEST: Response status: {response.StatusCode}");
                    
                    string responseContent = await response.Content.ReadAsStringAsync();
                    Logging.AddToLog($"TEST: Response content: {responseContent}");
                    Console.WriteLine($"TEST: Response content: {responseContent}");
                    
                    if (response.IsSuccessStatusCode)
                    {
                        Logging.AddToLog($"TEST: Successfully connected to endpoint: {endpoint}");
                        Console.WriteLine($"TEST: Successfully connected to endpoint: {endpoint}");
                    }
                }
                catch (Exception ex)
                {
                    Logging.AddToLog($"TEST: Error connecting to {endpoint}: {ex.Message}");
                    Console.WriteLine($"TEST: Error connecting to {endpoint}: {ex.Message}");
                }
            }
            
            // Now try a direct test of the auth middleware
            string authTestUrl = $"{baseUrl}/bot-integration/test-auth";
            Logging.AddToLog($"TEST: Testing authentication at: {authTestUrl}");
            Console.WriteLine($"TEST: Testing authentication at: {authTestUrl}");
            
            try
            {
                var payload = new { };
                var jsonContent = JsonConvert.SerializeObject(payload);
                var content = new StringContent(jsonContent, Encoding.UTF8);
                content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                var response = await _httpClient.PostAsync(authTestUrl, content);
                
                Logging.AddToLog($"TEST: Auth test response: {response.StatusCode}");
                Console.WriteLine($"TEST: Auth test response: {response.StatusCode}");
                
                string responseContent = await response.Content.ReadAsStringAsync();
                Logging.AddToLog($"TEST: Auth test content: {responseContent}");
                Console.WriteLine($"TEST: Auth test content: {responseContent}");
            }
            catch (Exception ex)
            {
                Logging.AddToLog($"TEST: Auth test error: {ex.Message}");
                Console.WriteLine($"TEST: Auth test error: {ex.Message}");
            }
        }
        catch (Exception ex)
        {
            Logging.AddToLog($"TEST: General error: {ex.Message}");
            Console.WriteLine($"TEST: General error: {ex.Message}");
        }
    }
    
    private static string LoadApiKeyFromConfig()
    {
        try
        {
            string configPath = "config.conf";
            if (System.IO.File.Exists(configPath))
            {
                string[] lines = System.IO.File.ReadAllLines(configPath);
                foreach (string line in lines)
                {
                    if (line.StartsWith("apiKey="))
                    {
                        return line.Substring(7).Trim();
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Logging.AddToLog("Error loading API key from config: " + ex.Message);
            Console.WriteLine("Error loading API key from config: " + ex.Message);
        }
        return string.Empty;
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
