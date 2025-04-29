using System;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace TelegramReferralBot
{
    public class SuperRetryHandler : DelegatingHandler
    {
        private readonly int _maxRetries = 10;
        private readonly TimeSpan _initialDelay = TimeSpan.FromSeconds(1);
        private readonly Random _jitterRandom = new Random();
        private int _consecutiveFailures = 0;
        private DateTime _lastSuccessTime = DateTime.UtcNow;
        private readonly object _lockObject = new object();

        public SuperRetryHandler(HttpMessageHandler innerHandler) : base(innerHandler)
        {
        }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            // Circuit breaker pattern
            if (_consecutiveFailures > 20)
            {
                if ((DateTime.UtcNow - _lastSuccessTime).TotalMinutes < 5)
                {
                    lock (_lockObject)
                    {
                        _consecutiveFailures = 0;
                    }
                }
                else
                {
                    await Task.Delay(TimeSpan.FromSeconds(30), cancellationToken);
                }
            }

            HttpResponseMessage? response = null;
            var delay = _initialDelay;
            Exception? lastException = null;
            
            for (int i = 0; i <= _maxRetries; i++)
            {
                try
                {
                    var requestMessage = i == 0 ? request : CloneRequest(request);
                    
                    if (i > 0)
                    {
                        await Task.Delay(delay + TimeSpan.FromMilliseconds(_jitterRandom.Next(0, 1000)), cancellationToken);
                    }
                    
                    response = await base.SendAsync(requestMessage, cancellationToken).ConfigureAwait(false);
                    
                    if (response.IsSuccessStatusCode || 
                        (response.StatusCode != HttpStatusCode.InternalServerError && 
                         response.StatusCode != HttpStatusCode.BadGateway && 
                         response.StatusCode != HttpStatusCode.ServiceUnavailable && 
                         response.StatusCode != HttpStatusCode.GatewayTimeout))
                    {
                        lock (_lockObject)
                        {
                            _consecutiveFailures = 0;
                            _lastSuccessTime = DateTime.UtcNow;
                        }
                        return response;
                    }
                    
                    if (i == _maxRetries)
                    {
                        return response;
                    }
                    
                    response.Dispose();
                }
                catch (Exception ex)
                {
                    lastException = ex;
                    
                    lock (_lockObject)
                    {
                        _consecutiveFailures++;
                    }
                    
                    if (i == _maxRetries)
                    {
                        throw;
                    }
                }
                
                delay = TimeSpan.FromMilliseconds(Math.Min(30000, delay.TotalMilliseconds * 2));
            }
            
            throw lastException ?? new HttpRequestException("Request failed after multiple retries");
        }

        private static HttpRequestMessage CloneRequest(HttpRequestMessage request)
        {
            var clone = new HttpRequestMessage(request.Method, request.RequestUri)
            {
                Content = request.Content,
                Version = request.Version
            };
            
            foreach (var header in request.Headers)
            {
                clone.Headers.TryAddWithoutValidation(header.Key, header.Value);
            }

            return clone;
        }
    }
}
