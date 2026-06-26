using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Hosting;
using back.Data;
using back.Models;

namespace back.Services;

public class TelegramNotificationService
{
    private readonly TreelyDbContext _context;
    private readonly IConfiguration _config;
    private readonly IWebHostEnvironment _env;

    public TelegramNotificationService(TreelyDbContext context, IConfiguration config, IWebHostEnvironment env)
    {
        _context = context;
        _config = config;
        _env = env;
    }

    public async Task SendPartyNotificationAsync(FamilyTree tree, FamilyParty party)
    {
        var botToken = _config["Authentication:Telegram:BotToken"];
        if (string.IsNullOrEmpty(botToken) || botToken.Contains("YOUR_TELEGRAM_BOT_TOKEN"))
        {
            Console.WriteLine("Telegram bot token not configured. Skipping notifications.");
            return;
        }

        // Get user IDs of all collaborators on the tree
        var collaboratorUserIds = tree.Collaborators
            .Select(c => c.UserId)
            .Where(id => id != party.CreatorId) // Don't notify the creator
            .ToList();

        if (!collaboratorUserIds.Any()) return;

        // Fetch users who have a TelegramId
        var users = await _context.Users
            .Where(u => collaboratorUserIds.Contains(u.Id) && u.TelegramId != null && u.TelegramId != "")
            .ToListAsync();

        if (!users.Any()) return;

        // Construct message
        var dateFormatted = party.Date;
        var timeFormatted = party.Time;
        var message = $"🎉 *New Family Event: {party.Title}* \n\n" +
                      $"📝 *Description:* {party.Description}\n" +
                      $"📅 *Date:* {dateFormatted}\n" +
                      $"⏰ *Time:* {timeFormatted}\n\n" +
                      $"Sign in to Treely to RSVP, see location details, contribute sponsorships, or view shared photos!";

        using var client = new HttpClient();
        var url = $"https://api.telegram.org/bot{botToken}/sendMessage";

        foreach (var user in users)
        {
            try
            {
                var payload = new
                {
                    chat_id = user.TelegramId,
                    text = message,
                    parse_mode = "Markdown"
                };
                
                client.Timeout = TimeSpan.FromSeconds(5);
                var response = await client.PostAsJsonAsync(url, payload);
                if (!response.IsSuccessStatusCode)
                {
                    var err = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Failed to send Telegram notification to {user.Email}: {err}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending Telegram notification to user {user.Id}: {ex.Message}");
            }
        }
    }
}
