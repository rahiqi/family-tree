using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using back.Data;
using back.Models;
using back.Services;

namespace back.Controllers;

[Authorize]
[ApiController]
[Route("api/tree/{treeId}/[controller]")]
public class PartyController : ControllerBase
{
    private readonly TreelyDbContext _context;
    private readonly IWebHostEnvironment _env;
    private readonly TelegramNotificationService _telegramService;

    public PartyController(TreelyDbContext context, IWebHostEnvironment env, TelegramNotificationService telegramService)
    {
        _context = context;
        _env = env;
        _telegramService = telegramService;
    }

    private Guid GetCurrentUserId()
    {
        var idStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(idStr, out var id) ? id : Guid.Empty;
    }

    private async Task<string?> GetUserRoleAsync(Guid treeId, Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user != null && user.IsSuperAdmin) return "owner";

        var tree = await _context.FamilyTrees.FindAsync(treeId);
        if (tree == null) return null;

        var collaborator = tree.Collaborators.FirstOrDefault(c => c.UserId == userId);
        return collaborator?.Role;
    }

    public class CreatePartyDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
        public string Time { get; set; } = string.Empty;
        public bool IsPublic { get; set; } = true;
        public List<Guid> AllowedMemberIds { get; set; } = new();
        public string Recurrence { get; set; } = "one-time";
        public bool NeedsSponsor { get; set; } = false;
        public decimal TargetAmount { get; set; } = 0;
        public bool OpenRegistration { get; set; } = false;
    }

    public class SponsorDto
    {
        public decimal Amount { get; set; }
    }

    // Helper to check visibility and sanitize location
    private object SanitizeParty(FamilyParty party, Guid userId, bool isManager)
    {
        var isParticipant = party.Participants.Any(p => p.UserId == userId) || 
                            party.Sponsorships.Any(s => s.UserId == userId) || 
                            party.CreatorId == userId;

        var showLocation = isManager || isParticipant;

        return new
        {
            party.Id,
            party.TreeId,
            party.CreatorId,
            party.Title,
            party.Description,
            Location = showLocation ? party.Location : "Only visible to participants",
            party.Date,
            party.Time,
            party.IsPublic,
            party.AllowedMemberIds,
            party.Recurrence,
            party.NeedsSponsor,
            party.TargetAmount,
            party.OpenRegistration,
            party.Sponsorships,
            party.Participants,
            party.PhotoAlbum,
            party.CreatedAt,
            IsUserJoined = party.Participants.Any(p => p.UserId == userId),
            IsUserSponsor = party.Sponsorships.Any(s => s.UserId == userId),
            TotalSponsorships = party.Sponsorships.Sum(s => s.Amount)
        };
    }

    [HttpGet]
    public async Task<IActionResult> GetParties(Guid treeId)
    {
        var tree = await _context.FamilyTrees.FindAsync(treeId);
        if (tree == null) return NotFound("Family tree not found.");

        var userId = GetCurrentUserId();
        var role = await GetUserRoleAsync(treeId, userId);
        
        // If private tree and user is not collaborator, deny
        if (tree.IsPublic != true && role == null)
        {
            return Forbid("Access denied.");
        }

        var isManager = role == "owner" || role == "editor";

        // Query parties
        var query = _context.FamilyParties.Where(p => p.TreeId == treeId);
        var allParties = await query.ToListAsync();

        // Filter by visibility: if not manager, only see public parties OR private ones you are allowed to see
        var visibleParties = allParties
            .Where(p => p.IsPublic || isManager || p.CreatorId == userId || p.AllowedMemberIds.Contains(userId))
            .Select(p => SanitizeParty(p, userId, isManager))
            .ToList();

        return Ok(visibleParties);
    }

    [HttpGet("{partyId}")]
    public async Task<IActionResult> GetPartyDetails(Guid treeId, Guid partyId)
    {
        var tree = await _context.FamilyTrees.FindAsync(treeId);
        if (tree == null) return NotFound("Family tree not found.");

        var userId = GetCurrentUserId();
        var role = await GetUserRoleAsync(treeId, userId);
        
        if (tree.IsPublic != true && role == null)
        {
            return Forbid("Access denied.");
        }

        var party = await _context.FamilyParties.FindAsync(partyId);
        if (party == null || party.TreeId != treeId) return NotFound("Party not found.");

        var isManager = role == "owner" || role == "editor";

        // Check visibility
        if (!party.IsPublic && !isManager && party.CreatorId != userId && !party.AllowedMemberIds.Contains(userId))
        {
            return Forbid("You do not have access to view this party.");
        }

        return Ok(SanitizeParty(party, userId, isManager));
    }

    [HttpPost]
    public async Task<IActionResult> CreateParty(Guid treeId, [FromBody] CreatePartyDto dto)
    {
        var tree = await _context.FamilyTrees.FindAsync(treeId);
        if (tree == null) return NotFound("Family tree not found.");

        var userId = GetCurrentUserId();
        var role = await GetUserRoleAsync(treeId, userId);

        if (role != "owner" && role != "editor")
        {
            return Forbid("Only Editors or Owners can create parties.");
        }

        // Get creator info
        var creator = await _context.Users.FindAsync(userId);
        var creatorName = creator != null ? $"{creator.FirstName} {creator.LastName}".Trim() : "Organizer";

        var party = new FamilyParty
        {
            Id = Guid.NewGuid(),
            TreeId = treeId,
            CreatorId = userId,
            Title = dto.Title,
            Description = dto.Description,
            Location = dto.Location,
            Date = dto.Date,
            Time = dto.Time,
            IsPublic = dto.IsPublic,
            AllowedMemberIds = dto.AllowedMemberIds ?? new List<Guid>(),
            Recurrence = dto.Recurrence,
            NeedsSponsor = dto.NeedsSponsor,
            TargetAmount = dto.TargetAmount,
            OpenRegistration = dto.OpenRegistration,
            Participants = new List<PartyParticipant>
            {
                new PartyParticipant
                {
                    UserId = userId,
                    Name = creatorName,
                    Role = "Organizer",
                    JoinedAt = DateTime.UtcNow
                }
            }
        };

        _context.FamilyParties.Add(party);
        await _context.SaveChangesAsync();

        // Trigger Telegram notifications to collaborators asynchronously
        _ = Task.Run(async () =>
        {
            try
            {
                await _telegramService.SendPartyNotificationAsync(tree, party);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error triggering telegram notification task: {ex.Message}");
            }
        });

        return CreatedAtAction(nameof(GetPartyDetails), new { treeId, partyId = party.Id }, SanitizeParty(party, userId, true));
    }

    [HttpPut("{partyId}")]
    public async Task<IActionResult> UpdateParty(Guid treeId, Guid partyId, [FromBody] CreatePartyDto dto)
    {
        var party = await _context.FamilyParties.FindAsync(partyId);
        if (party == null || party.TreeId != treeId) return NotFound("Party not found.");

        var userId = GetCurrentUserId();
        var role = await GetUserRoleAsync(treeId, userId);

        // Only Creator, Editor, or Owner can update
        if (party.CreatorId != userId && role != "owner" && role != "editor")
        {
            return Forbid("You do not have permission to modify this party.");
        }

        party.Title = dto.Title;
        party.Description = dto.Description;
        party.Location = dto.Location;
        party.Date = dto.Date;
        party.Time = dto.Time;
        party.IsPublic = dto.IsPublic;
        party.AllowedMemberIds = dto.AllowedMemberIds ?? new List<Guid>();
        party.Recurrence = dto.Recurrence;
        party.NeedsSponsor = dto.NeedsSponsor;
        party.TargetAmount = dto.TargetAmount;
        party.OpenRegistration = dto.OpenRegistration;

        _context.FamilyParties.Update(party);
        await _context.SaveChangesAsync();

        return Ok(SanitizeParty(party, userId, role == "owner" || role == "editor"));
    }

    [HttpDelete("{partyId}")]
    public async Task<IActionResult> DeleteParty(Guid treeId, Guid partyId)
    {
        var party = await _context.FamilyParties.FindAsync(partyId);
        if (party == null || party.TreeId != treeId) return NotFound("Party not found.");

        var userId = GetCurrentUserId();
        var role = await GetUserRoleAsync(treeId, userId);

        if (party.CreatorId != userId && role != "owner" && role != "editor")
        {
            return Forbid("You do not have permission to delete this party.");
        }

        _context.FamilyParties.Remove(party);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Party deleted successfully." });
    }

    [HttpPost("{partyId}/join")]
    public async Task<IActionResult> JoinParty(Guid treeId, Guid partyId)
    {
        var tree = await _context.FamilyTrees.FindAsync(treeId);
        if (tree == null) return NotFound("Family tree not found.");

        var userId = GetCurrentUserId();
        var role = await GetUserRoleAsync(treeId, userId);

        if (tree.IsPublic != true && role == null)
        {
            return Forbid("Access denied.");
        }

        var party = await _context.FamilyParties.FindAsync(partyId);
        if (party == null || party.TreeId != treeId) return NotFound("Party not found.");

        // Check visibility
        var isManager = role == "owner" || role == "editor";
        if (!party.IsPublic && !isManager && party.CreatorId != userId && !party.AllowedMemberIds.Contains(userId))
        {
            return Forbid("You do not have access to this party.");
        }

        // If already joined, do nothing
        if (party.Participants.Any(p => p.UserId == userId))
        {
            return Ok(SanitizeParty(party, userId, isManager));
        }

        // Add user to participants list
        var user = await _context.Users.FindAsync(userId);
        var userName = user != null ? $"{user.FirstName} {user.LastName}".Trim() : "Attendee";

        party.Participants.Add(new PartyParticipant
        {
            UserId = userId,
            Name = userName,
            Role = "Attendee",
            JoinedAt = DateTime.UtcNow
        });

        _context.FamilyParties.Update(party);
        await _context.SaveChangesAsync();

        return Ok(SanitizeParty(party, userId, isManager));
    }

    [HttpPost("{partyId}/sponsor")]
    public async Task<IActionResult> SponsorParty(Guid treeId, Guid partyId, [FromBody] SponsorDto dto)
    {
        if (dto.Amount <= 0) return BadRequest("Sponsorship amount must be greater than zero.");

        var tree = await _context.FamilyTrees.FindAsync(treeId);
        if (tree == null) return NotFound("Family tree not found.");

        var userId = GetCurrentUserId();
        var role = await GetUserRoleAsync(treeId, userId);

        if (tree.IsPublic != true && role == null)
        {
            return Forbid("Access denied.");
        }

        var party = await _context.FamilyParties.FindAsync(partyId);
        if (party == null || party.TreeId != treeId) return NotFound("Party not found.");

        // Check visibility
        var isManager = role == "owner" || role == "editor";
        if (!party.IsPublic && !isManager && party.CreatorId != userId && !party.AllowedMemberIds.Contains(userId))
        {
            return Forbid("You do not have access to this party.");
        }

        var user = await _context.Users.FindAsync(userId);
        var userName = user != null ? $"{user.FirstName} {user.LastName}".Trim() : "Sponsor";

        // Add or update sponsorship pledge
        var existingSponsorship = party.Sponsorships.FirstOrDefault(s => s.UserId == userId);
        if (existingSponsorship != null)
        {
            existingSponsorship.Amount += dto.Amount;
            existingSponsorship.PledgedAt = DateTime.UtcNow;
        }
        else
        {
            party.Sponsorships.Add(new PartySponsorship
            {
                UserId = userId,
                SponsorName = userName,
                Amount = dto.Amount,
                PledgedAt = DateTime.UtcNow
            });
        }

        // If OpenRegistration is enabled or they pay, they should also be joined as participant
        if (party.OpenRegistration || !party.Participants.Any(p => p.UserId == userId))
        {
            if (!party.Participants.Any(p => p.UserId == userId))
            {
                party.Participants.Add(new PartyParticipant
                {
                    UserId = userId,
                    Name = userName,
                    Role = "Attendee (Sponsor)",
                    JoinedAt = DateTime.UtcNow
                });
            }
        }

        _context.FamilyParties.Update(party);
        await _context.SaveChangesAsync();

        return Ok(SanitizeParty(party, userId, isManager));
    }

    [HttpPost("{partyId}/upload")]
    public async Task<IActionResult> UploadPhoto(Guid treeId, Guid partyId, [FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("No file uploaded.");
        }

        var tree = await _context.FamilyTrees.FindAsync(treeId);
        if (tree == null) return NotFound("Family tree not found.");

        var userId = GetCurrentUserId();
        var role = await GetUserRoleAsync(treeId, userId);

        if (tree.IsPublic != true && role == null)
        {
            return Forbid("Access denied.");
        }

        var party = await _context.FamilyParties.FindAsync(partyId);
        if (party == null || party.TreeId != treeId) return NotFound("Party not found.");

        // Check if user has access to this private party
        var isManager = role == "owner" || role == "editor";
        if (!party.IsPublic && !isManager && party.CreatorId != userId && !party.AllowedMemberIds.Contains(userId))
        {
            return Forbid("You do not have access to this party.");
        }

        // Only participants (joined or sponsors) or tree managers can upload photos
        var isParticipant = party.Participants.Any(p => p.UserId == userId) || 
                            party.Sponsorships.Any(s => s.UserId == userId) || 
                            party.CreatorId == userId;

        if (!isParticipant && !isManager)
        {
            return Forbid("Only party participants can share media assets.");
        }

        var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var fileUrl = $"/uploads/{fileName}";

        // Add media to party album
        party.PhotoAlbum.Add(new MediaAsset
        {
            Url = fileUrl,
            Caption = $"Uploaded by participant at {DateTime.UtcNow:yyyy-MM-dd HH:mm}"
        });

        _context.FamilyParties.Update(party);
        await _context.SaveChangesAsync();

        return Ok(SanitizeParty(party, userId, isManager));
    }
}
