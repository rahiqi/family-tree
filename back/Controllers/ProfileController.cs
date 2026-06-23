using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json.Nodes;
using back.Data;
using back.Models;

namespace back.Controllers;

[Authorize]
[ApiController]
[Route("api/tree/{treeId}/[controller]")]
public class ProfileController : ControllerBase
{
    private readonly TreelyDbContext _context;
    private readonly IWebHostEnvironment _env;

    public ProfileController(TreelyDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    private Guid GetCurrentUserId()
    {
        var idStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(idStr, out var id) ? id : Guid.Empty;
    }

    private async Task<string?> GetUserRoleAsync(Guid treeId, Guid userId)
    {
        var tree = await _context.FamilyTrees.FindAsync(treeId);
        if (tree == null) return null;

        var collaborator = tree.Collaborators.FirstOrDefault(c => c.UserId == userId);
        return collaborator?.Role;
    }

    public class UpdateProfileDto
    {
        public string? Biography { get; set; }
        public string? AvatarUrl { get; set; }
        public List<MediaAsset> PhotoAlbum { get; set; } = new();
        public List<TimelineEvent> TimelineEvents { get; set; } = new();
    }

    [AllowAnonymous]
    [HttpGet("{personId}")]
    public async Task<IActionResult> GetProfile(Guid treeId, string personId)
    {
        var tree = await _context.FamilyTrees.FindAsync(treeId);
        if (tree == null)
        {
            return NotFound("Family tree not found.");
        }

        var userId = GetCurrentUserId();
        var collaborator = tree.Collaborators.FirstOrDefault(c => c.UserId == userId);
        
        // If the tree is private and the user is not a collaborator, deny access
        if (tree.IsPublic != true && collaborator == null)
        {
            return Forbid("You do not have access to this family tree.");
        }

        var profile = await _context.PersonProfiles
            .FirstOrDefaultAsync(p => p.TreeId == treeId && p.Id == personId);

        if (profile == null)
        {
            return Ok(new PersonProfile
            {
                Id = personId,
                TreeId = treeId,
                Biography = string.Empty,
                AvatarUrl = string.Empty,
                PhotoAlbum = new List<MediaAsset>(),
                TimelineEvents = new List<TimelineEvent>()
            });
        }

        return Ok(profile);
    }


    [HttpPost("{personId}")]
    public async Task<IActionResult> UpdateProfile(Guid treeId, string personId, [FromBody] UpdateProfileDto dto)
    {
        var userId = GetCurrentUserId();
        var role = await GetUserRoleAsync(treeId, userId);
        if (role == null)
        {
            return Forbid("You do not have access to this family tree.");
        }

        if (role != "owner" && role != "editor")
        {
            return Forbid("You do not have permission to edit this profile.");
        }

        if (role == "editor")
        {
            var tree = await _context.FamilyTrees.FindAsync(treeId);
            if (tree != null)
            {
                var graph = JsonNode.Parse(tree.TreeGraphJsonData ?? "[]")?.AsArray();
                var matchedNode = graph?.FirstOrDefault(n => n?["id"]?.ToString() == personId);
                
                var ownerCollab = tree.Collaborators.FirstOrDefault(c => c.Role == "owner");
                var ownerIdStr = ownerCollab?.UserId.ToString() ?? string.Empty;
                
                var addedBy = matchedNode?["addedBy"]?.ToString() ?? string.Empty;
                var actualOwner = string.IsNullOrEmpty(addedBy) ? ownerIdStr : addedBy;
                
                if (actualOwner != userId.ToString())
                {
                    return StatusCode(403, "You can only edit profiles of nodes that you have added yourself.");
                }
            }
        }

        var profile = await _context.PersonProfiles
            .FirstOrDefaultAsync(p => p.TreeId == treeId && p.Id == personId);

        if (profile == null)
        {
            profile = new PersonProfile
            {
                Id = personId,
                TreeId = treeId,
                Biography = dto.Biography,
                AvatarUrl = dto.AvatarUrl,
                PhotoAlbum = dto.PhotoAlbum,
                TimelineEvents = dto.TimelineEvents
            };
            _context.PersonProfiles.Add(profile);
        }
        else
        {
            profile.Biography = dto.Biography;
            profile.AvatarUrl = dto.AvatarUrl;
            profile.PhotoAlbum = dto.PhotoAlbum;
            profile.TimelineEvents = dto.TimelineEvents;
            _context.Entry(profile).State = EntityState.Modified;
        }

        await _context.SaveChangesAsync();
        return Ok(profile);
    }

    [HttpPost("{personId}/upload")]
    public async Task<IActionResult> UploadPhoto(Guid treeId, string personId, IFormFile file)
    {
        var userId = GetCurrentUserId();
        var role = await GetUserRoleAsync(treeId, userId);
        if (role == null)
        {
            return Forbid("You do not have access to this family tree.");
        }

        if (role != "owner" && role != "editor")
        {
            return Forbid("You do not have permission to upload photos.");
        }

        if (role == "editor")
        {
            var tree = await _context.FamilyTrees.FindAsync(treeId);
            if (tree != null)
            {
                var graph = JsonNode.Parse(tree.TreeGraphJsonData ?? "[]")?.AsArray();
                var matchedNode = graph?.FirstOrDefault(n => n?["id"]?.ToString() == personId);
                
                var ownerCollab = tree.Collaborators.FirstOrDefault(c => c.Role == "owner");
                var ownerIdStr = ownerCollab?.UserId.ToString() ?? string.Empty;
                
                var addedBy = matchedNode?["addedBy"]?.ToString() ?? string.Empty;
                var actualOwner = string.IsNullOrEmpty(addedBy) ? ownerIdStr : addedBy;
                
                if (actualOwner != userId.ToString())
                {
                    return StatusCode(403, "You can only upload photos for profiles of nodes that you have added yourself.");
                }
            }
        }

        if (file == null || file.Length == 0)
        {
            return BadRequest("No file uploaded.");
        }

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest("Invalid image format. Allowed formats: JPG, JPEG, PNG, GIF, WEBP.");
        }

        var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var uploadFolder = Path.Combine(webRoot, "uploads");
        if (!Directory.Exists(uploadFolder))
        {
            Directory.CreateDirectory(uploadFolder);
        }

        var fileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var fileUrl = $"/uploads/{fileName}";

        return Ok(new { url = fileUrl });
    }

    [AllowAnonymous]
    [HttpGet("calendar")]
    public async Task<IActionResult> GetTreeCalendar(Guid treeId)
    {
        var tree = await _context.FamilyTrees.FindAsync(treeId);
        if (tree == null)
        {
            return NotFound("Family tree not found.");
        }

        var userId = GetCurrentUserId();
        var collaborator = tree.Collaborators.FirstOrDefault(c => c.UserId == userId);
        
        // If the tree is private and the user is not a collaborator, deny access
        if (tree.IsPublic != true && collaborator == null)
        {
            return Forbid("You do not have access to this family tree.");
        }

        // Parse tree graph data to map person IDs to names, genders, and avatars
        var personMap = new Dictionary<string, (string FullName, string? Avatar, string Gender)>();
        try
        {
            var graph = JsonNode.Parse(tree.TreeGraphJsonData ?? "[]")?.AsArray();
            if (graph != null)
            {
                foreach (var node in graph)
                {
                    if (node == null) continue;
                    var id = node["id"]?.ToString();
                    if (string.IsNullOrEmpty(id)) continue;

                    var dataNode = node["data"];
                    var fName = dataNode?["first name"]?.ToString() ?? dataNode?["firstName"]?.ToString() ?? string.Empty;
                    var lName = dataNode?["last name"]?.ToString() ?? dataNode?["lastName"]?.ToString() ?? string.Empty;
                    var fullName = $"{fName} {lName}".Trim();
                    if (string.IsNullOrEmpty(fullName)) fullName = "Unnamed Person";

                    var avatar = dataNode?["avatar"]?.ToString();
                    var gender = dataNode?["gender"]?.ToString() ?? "M";

                    personMap[id] = (fullName, avatar, gender);
                }
            }
        }
        catch (Exception ex)
        {
            // Log and continue
            Console.WriteLine($"Error parsing tree graph in GetTreeCalendar: {ex.Message}");
        }

        // Fetch all profiles for this tree
        var profiles = await _context.PersonProfiles
            .Where(p => p.TreeId == treeId)
            .ToListAsync();

        var events = new List<object>();

        foreach (var profile in profiles)
        {
            personMap.TryGetValue(profile.Id, out var personInfo);
            var fullName = personInfo.FullName ?? "Unnamed Person";
            var avatar = personInfo.Avatar ?? profile.AvatarUrl;
            var gender = personInfo.Gender ?? "M";

            foreach (var ev in profile.TimelineEvents)
            {
                events.Add(new
                {
                    ev.Id,
                    ev.Date,
                    ev.Title,
                    ev.Description,
                    ev.Type,
                    PersonId = profile.Id,
                    PersonName = fullName,
                    PersonAvatar = avatar,
                    PersonGender = gender
                });
            }
        }

        return Ok(events);
    }
}
