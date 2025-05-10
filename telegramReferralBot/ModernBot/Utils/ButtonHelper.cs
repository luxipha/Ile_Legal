using Telegram.Bot.Types.ReplyMarkups;
using System;
using System.Linq;
using System.Collections.Generic;

namespace TelegramReferralBot.Utils
{
    public static class ButtonHelper
    {
        public static InlineKeyboardMarkup CreateInlineKeyboard(IEnumerable<IEnumerable<(string text, string callback)>> buttons)
        {
            Console.WriteLine($"[DEBUG] Creating inline keyboard with {buttons.Count()} rows");
            
            int buttonCount = 0;
            var keyboardButtons = buttons.Select((row, rowIndex) =>
            {
                Console.WriteLine($"[DEBUG] Processing row {rowIndex} with {row.Count()} buttons");
                
                return row.Select((button, buttonIndex) =>
                {
                    buttonCount++;
                    // Check if the callback is a URL (starts with http:// or https://)
                    if (button.callback.StartsWith("http://") || button.callback.StartsWith("https://"))
                    {
                        Console.WriteLine($"[DEBUG] Creating URL button: '{button.text}' -> {button.callback}");
                        return InlineKeyboardButton.WithUrl(text: button.text, url: button.callback);
                    }
                    else
                    {
                        Console.WriteLine($"[DEBUG] Creating callback button: '{button.text}' -> {button.callback}");
                        return InlineKeyboardButton.WithCallbackData(text: button.text, callbackData: button.callback);
                    }
                }).ToArray();
            }).ToArray();

            Console.WriteLine($"[DEBUG] Created keyboard with {buttonCount} total buttons");
            return new InlineKeyboardMarkup(keyboardButtons);
        }
        
        // Helper method to log button clicks
        public static void LogButtonClick(string userId, string buttonText, string callbackData)
        {
            Console.WriteLine($"[DEBUG] Button clicked by user {userId}: '{buttonText}' with callback data: {callbackData}");
        }
    }
}
