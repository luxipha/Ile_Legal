using System;
using System.Net;
using System.Text;
using System.Timers;
using Telegram.Bot;
using Telegram.Bot.Exceptions;
using Telegram.Bot.Polling;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;
using Polly;
using Polly.Extensions.Http;
using System.Globalization;
using File = System.IO.File;
using TelegramReferralBot.Services;
using TelegramReferralBot.Utils;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace TelegramReferralBot;

class Program
{
    // Static variables
    private static TelegramBotClient _botClient = null!;
    private static readonly CancellationTokenSource _cts = new();
    private static readonly HashSet<int> _recentlyProcessedMessageIds = new HashSet<int>();
    private static readonly object _messageIdsLock = new object();
    private static HttpListener _listener = null!;
    
    // Services
    private static IServiceProvider _services = null!;
    private static IBotLogger _logger = null!;
    
    // Service accessors
    public static MongoDbService MongoDb => _services.GetRequiredService<MongoDbService>();
    public static MessageProcessor MessageProcessor => _services.GetRequiredService<MessageProcessor>();
    public static TelegramBotClient BotClient => _services.GetRequiredService<TelegramBotClient>();

    static async Task Main(string[] args)
    {
        // Test runner functionality has been moved to a separate class
        // Commenting out to fix build error
        //if (args.Length > 0 && args[0] == "test")
        //{
        //    await TestRunner.RunTests();
        //    return;
        //}
        try
        {
            // Load environment variables
            DotEnv.Load(".env.local");
            
            // Initialize logger
            var loggerFactory = LoggerFactory.Create(builder => builder.AddConsole());
            var msLogger = loggerFactory.CreateLogger<Program>();
            _logger = new LoggerAdapter(msLogger);
            _logger.Log("Starting bot...");

            // Setup dependency injection
            var services = new ServiceCollection();
            
            // Add configuration
            string? connectionString = Environment.GetEnvironmentVariable("MONGODB_CONNECTION_STRING");
            string? databaseName = Environment.GetEnvironmentVariable("MONGODB_DATABASE_NAME");
            string? botToken = Environment.GetEnvironmentVariable("BOT_TOKEN");
            
            if (string.IsNullOrEmpty(connectionString) || string.IsNullOrEmpty(databaseName))
            {
                _logger.Log("Missing MongoDB configuration!");
                return;
            }
            
            if (string.IsNullOrEmpty(botToken))
            {
                _logger.Log("Missing bot token!");
                return;
            }
            
            // Add services
            services.AddSingleton<ILoggerFactory>(loggerFactory);
            
            services.AddSingleton<MongoDbService>(sp => {
                var mongo = new MongoDbService(
                    connectionString,
                    databaseName,
                    sp.GetRequiredService<ILoggerFactory>().CreateLogger<MongoDbService>());
                mongo.InitializeAsync().Wait();
                return mongo;
            });
            
            var botClient = new TelegramBotClient(botToken);
            services.AddSingleton<ITelegramBotClient>(botClient);
            services.AddSingleton<TelegramBotClient>(botClient);
            services.AddSingleton<IBotLogger>(_logger);
            services.AddSingleton<MessageProcessor>();
            
            // Add app settings
            var appSettings = new AppSettings
            {
                LinkGroup = Environment.GetEnvironmentVariable("LINK_GROUP") ?? "https://telegram.me/aisolae",
                LinkBot = Environment.GetEnvironmentVariable("LINK_BOT") ?? "https://telegram.me/iletesbot",
                JoinReward = int.Parse(Environment.GetEnvironmentVariable("JOIN_REWARD") ?? "30"),
                ReferralReward = int.Parse(Environment.GetEnvironmentVariable("REFERRAL_REWARD") ?? "150"),
                StreakReward = int.Parse(Environment.GetEnvironmentVariable("STREAK_REWARD") ?? "300")
            };
            services.AddSingleton(appSettings);
            
            // Add reminder service
            services.AddSingleton<ReminderService>();
            
            // Build service provider
            _services = services.BuildServiceProvider();
            
            // Get required services
            _botClient = BotClient;
            var messageProcessor = MessageProcessor;
            
            _logger.Log("Services initialized");

            // Start receiving updates
            using var cts = new CancellationTokenSource();
            var receiverOptions = new ReceiverOptions
            {
                AllowedUpdates = Array.Empty<UpdateType>(),
                ThrowPendingUpdates = true
            };

            _botClient.StartReceiving(
                updateHandler: HandleUpdateAsync,
                pollingErrorHandler: HandlePollingErrorAsync,
                receiverOptions: receiverOptions,
                cancellationToken: cts.Token
            );

            var me = await _botClient.GetMeAsync();
            _logger.Log($"Bot started successfully: @{me.Username}");

            // Start health check server
            await StartHealthCheckServer();

            // Keep the application running
            await Task.Delay(-1);
        }
        catch (Exception ex)
        {
            _logger.Log($"Fatal error: {ex.Message}");
            Environment.Exit(1);
        }
    }
<<<<<<< HEAD
    
    private static void StartHealthCheckServer()
    {
        try
        {
            _listener = new HttpListener();
            _listener.Prefixes.Add("http://+:8080/");
            _listener.Start();
            
            Logging.AddToLog("Started health check server on port 8080");
            
            // Start a thread to handle health check requests
            new Thread(() =>
            {
                while (_listener.IsListening)
                {
                    try
                    {
                        // Wait for a request
                        HttpListenerContext context = _listener.GetContext();
                        HttpListenerRequest request = context.Request;
                        HttpListenerResponse response = context.Response;
                        
                        // Log the request
                        Logging.AddToLog($"Received request: {request.HttpMethod} {request.Url.PathAndQuery}");
                        
                        // Handle health check endpoint
                        if (request.Url.PathAndQuery == "/health" || request.Url.PathAndQuery == "/")
                        {
                            string responseString = "OK - IleRefer Bot is running";
                            byte[] buffer = Encoding.UTF8.GetBytes(responseString);
                            
                            response.ContentLength64 = buffer.Length;
                            response.StatusCode = 200;
                            Stream output = response.OutputStream;
                            output.Write(buffer, 0, buffer.Length);
                            output.Close();
                            
                            Logging.AddToLog("Health check request successful");
                        }
                        else
                        {
                            response.StatusCode = 404;
                            response.Close();
                        }
                    }
                    catch (Exception ex)
                    {
                        Logging.AddToLog($"Error handling health check request: {ex.Message}");
                    }
                }
            }).Start();
        }
        catch (Exception ex)
        {
            Logging.AddToLog($"Failed to start health check server: {ex.Message}");
        }
    }
    
    /// <summary>
    /// Clears any existing webhook to avoid conflicts
    /// </summary>
    private static async Task ClearWebhook(ITelegramBotClient botClient)
    {
        try
        {
            await botClient.DeleteWebhookAsync(dropPendingUpdates: true);
            Logging.AddToLog("Webhook cleared successfully.");
        }
        catch (Exception ex)
        {
            Logging.AddToLog($"Error clearing webhook: {ex.Message}");
            throw; // Rethrow to be handled by the calling method
        }
    }
    
    /// <summary>
    /// Handles incoming updates from Telegram
    /// </summary>
=======

>>>>>>> mongodb-improvements
    private static async Task HandleUpdateAsync(ITelegramBotClient botClient, Update update, CancellationToken cancellationToken)
    {
        try
        {
            // Ignore duplicate messages
            if (update.Message?.MessageId != null)
            {
                lock (_messageIdsLock)
                {
                    if (_recentlyProcessedMessageIds.Contains(update.Message.MessageId))
                        return;
                    _recentlyProcessedMessageIds.Add(update.Message.MessageId);
                }
            }

            // Process update based on type
            switch (update.Type)
            {
                case UpdateType.Message:
                    if (update.Message != null)
                    {
                        await MessageProcessor.ProcessMessageAsync(update.Message, cancellationToken);
                    }
                    break;

                case UpdateType.CallbackQuery:
                    if (update.CallbackQuery != null)
                    {
                        await MessageProcessor.ProcessCallbackQueryAsync(update.CallbackQuery, cancellationToken);
                    }
                    break;
            }

            // Clean up old message IDs periodically
            if (_recentlyProcessedMessageIds.Count > 1000)
            {
                lock (_messageIdsLock)
                {
                    _recentlyProcessedMessageIds.Clear();
                }
            }
        }
        catch (Exception ex)
        {
            _logger.Log($"Error handling update: {ex.Message}");
        }
    }

    private static Task HandlePollingErrorAsync(ITelegramBotClient botClient, Exception exception, CancellationToken cancellationToken)
    {
        var errorMessage = exception switch
        {
            ApiRequestException apiRequestException
                => $"Telegram API Error: [{apiRequestException.ErrorCode}] {apiRequestException.Message}",
            _ => exception.ToString()
        };

        _logger.Log($"Polling error: {errorMessage}");
        return Task.CompletedTask;
    }

    private static async Task StartHealthCheckServer()
    {
        try
        {
            _listener = new HttpListener();
            _listener.Prefixes.Add("http://localhost:8080/");
            _listener.Start();

            _logger.Log("Health check server started on port 8080");

            // Handle health check requests
            while (true)
            {
                var context = await _listener.GetContextAsync();
                var response = context.Response;
                var responseString = "OK";
                var buffer = Encoding.UTF8.GetBytes(responseString);
                
                response.ContentLength64 = buffer.Length;
                var output = response.OutputStream;
                await output.WriteAsync(buffer);
                output.Close();
            }
        }
        catch (Exception ex)
        {
            _logger.Log($"Health check server error: {ex.Message}");
        }
    }
}
