using System;
using System.IO;

namespace TelegramReferralBot.Utils
{
    public static class DotEnv
    {
        public static void Load(string filename = ".env")
        {
            var envFile = Path.Combine(Directory.GetCurrentDirectory(), filename);
            if (File.Exists(envFile))
            {
                foreach (var line in File.ReadAllLines(envFile))
                {
                    if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#"))
                        continue;

                    var parts = line.Split('=', 2, StringSplitOptions.RemoveEmptyEntries);
                    if (parts.Length != 2)
                        continue;

                    Environment.SetEnvironmentVariable(parts[0].Trim(), parts[1].Trim());
                }
            }
        }
    }
}
