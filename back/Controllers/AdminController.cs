using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json.Nodes;
using System.Threading.Tasks;
using back.Data;
using back.Models;

namespace back.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly TreelyDbContext _context;

    public AdminController(TreelyDbContext context)
    {
        _context = context;
    }

    private Guid GetCurrentUserId()
    {
        var idStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(idStr, out var id) ? id : Guid.Empty;
    }

    private async Task<bool> IsSuperAdminAsync()
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == Guid.Empty) return false;

        var user = await _context.Users.FindAsync(currentUserId);
        return user?.IsSuperAdmin ?? false;
    }

    // GET: api/admin/stats
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        if (!await IsSuperAdminAsync())
        {
            return Forbid("Access denied. Super admin privileges required.");
        }

        var totalUsers = await _context.Users.CountAsync();
        var totalTrees = await _context.FamilyTrees.CountAsync();
        var totalProfiles = await _context.PersonProfiles.CountAsync();
        var totalParties = await _context.FamilyParties.CountAsync();

        return Ok(new
        {
            TotalUsers = totalUsers,
            TotalTrees = totalTrees,
            TotalProfiles = totalProfiles,
            TotalParties = totalParties
        });
    }

    // GET: api/admin/users
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        if (!await IsSuperAdminAsync())
        {
            return Forbid("Access denied. Super admin privileges required.");
        }

        var users = await _context.Users
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.FirstName,
                u.LastName,
                u.CreatedAt,
                u.IsSuperAdmin,
                HasPassword = !string.IsNullOrEmpty(u.PasswordHash),
                HasGoogle = !string.IsNullOrEmpty(u.GoogleId),
                HasTelegram = !string.IsNullOrEmpty(u.TelegramId)
            })
            .ToListAsync();

        return Ok(users);
    }

    public class UpdateUserAdminDto
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public bool? IsSuperAdmin { get; set; }
    }

    // PUT: api/admin/users/{userId}
    [HttpPut("users/{userId}")]
    public async Task<IActionResult> UpdateUser(Guid userId, [FromBody] UpdateUserAdminDto dto)
    {
        if (!await IsSuperAdminAsync())
        {
            return Forbid("Access denied. Super admin privileges required.");
        }

        var currentUserId = GetCurrentUserId();
        if (userId == currentUserId && dto.IsSuperAdmin == false)
        {
            return BadRequest("You cannot remove your own super admin privileges.");
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound("User not found.");
        }

        if (dto.FirstName != null) user.FirstName = dto.FirstName;
        if (dto.LastName != null) user.LastName = dto.LastName;
        if (dto.IsSuperAdmin != null) user.IsSuperAdmin = dto.IsSuperAdmin.Value;

        _context.Entry(user).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        return Ok(new
        {
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.CreatedAt,
            user.IsSuperAdmin
        });
    }

    // DELETE: api/admin/users/{userId}
    [HttpDelete("users/{userId}")]
    public async Task<IActionResult> DeleteUser(Guid userId)
    {
        if (!await IsSuperAdminAsync())
        {
            return Forbid("Access denied. Super admin privileges required.");
        }

        var currentUserId = GetCurrentUserId();
        if (userId == currentUserId)
        {
            return BadRequest("You cannot delete your own admin account.");
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound("User not found.");
        }

        // Clean up collaborator roles from all trees
        var trees = await _context.FamilyTrees.ToListAsync();
        foreach (var tree in trees)
        {
            var collab = tree.Collaborators.FirstOrDefault(c => c.UserId == userId);
            if (collab != null)
            {
                if (collab.Role == "owner" && tree.Collaborators.Count(c => c.Role == "owner") == 1)
                {
                    // This user is the sole owner. Delete this family tree entirely
                    var profiles = await _context.PersonProfiles.Where(p => p.TreeId == tree.Id).ToListAsync();
                    _context.PersonProfiles.RemoveRange(profiles);

                    var parties = await _context.FamilyParties.Where(p => p.TreeId == tree.Id).ToListAsync();
                    _context.FamilyParties.RemoveRange(parties);

                    _context.FamilyTrees.Remove(tree);
                }
                else
                {
                    // Remove them from the tree collaborators
                    tree.Collaborators.Remove(collab);
                    _context.Entry(tree).State = EntityState.Modified;
                }
            }
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "User and their owned family trees deleted successfully." });
    }

    // GET: api/admin/trees
    [HttpGet("trees")]
    public async Task<IActionResult> GetTrees()
    {
        if (!await IsSuperAdminAsync())
        {
            return Forbid("Access denied. Super admin privileges required.");
        }

        var trees = await _context.FamilyTrees.ToListAsync();
        var result = new List<object>();

        foreach (var tree in trees)
        {
            var owner = tree.Collaborators.FirstOrDefault(c => c.Role == "owner");
            var ownerEmail = owner?.Email ?? "Unknown";

            var memberCount = 0;
            try
            {
                var graph = JsonNode.Parse(tree.TreeGraphJsonData ?? "[]")?.AsArray();
                memberCount = graph?.Count ?? 0;
            }
            catch
            {
                // ignore parsing failures
            }

            result.Add(new
            {
                tree.Id,
                tree.Name,
                IsPublic = tree.IsPublic ?? false,
                tree.UpdatedAt,
                OwnerEmail = ownerEmail,
                CollaboratorsCount = tree.Collaborators.Count,
                MembersCount = memberCount
            });
        }

        return Ok(result.OrderByDescending(r => ((dynamic)r).UpdatedAt));
    }

    public class UpdateTreeAdminDto
    {
        public string? Name { get; set; }
        public bool? IsPublic { get; set; }
    }

    // PUT: api/admin/trees/{treeId}
    [HttpPut("trees/{treeId}")]
    public async Task<IActionResult> UpdateTree(Guid treeId, [FromBody] UpdateTreeAdminDto dto)
    {
        if (!await IsSuperAdminAsync())
        {
            return Forbid("Access denied. Super admin privileges required.");
        }

        var tree = await _context.FamilyTrees.FindAsync(treeId);
        if (tree == null)
        {
            return NotFound("Family tree not found.");
        }

        if (dto.Name != null) tree.Name = dto.Name.Trim();
        if (dto.IsPublic != null) tree.IsPublic = dto.IsPublic.Value;
        tree.UpdatedAt = DateTime.UtcNow;

        _context.Entry(tree).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        return Ok(tree);
    }

    // DELETE: api/admin/trees/{treeId}
    [HttpDelete("trees/{treeId}")]
    public async Task<IActionResult> DeleteTree(Guid treeId)
    {
        if (!await IsSuperAdminAsync())
        {
            return Forbid("Access denied. Super admin privileges required.");
        }

        var tree = await _context.FamilyTrees.FindAsync(treeId);
        if (tree == null)
        {
            return NotFound("Family tree not found.");
        }

        // Delete profiles
        var profiles = await _context.PersonProfiles.Where(p => p.TreeId == treeId).ToListAsync();
        _context.PersonProfiles.RemoveRange(profiles);

        // Delete parties
        var parties = await _context.FamilyParties.Where(p => p.TreeId == treeId).ToListAsync();
        _context.FamilyParties.RemoveRange(parties);

        // Delete tree
        _context.FamilyTrees.Remove(tree);

        await _context.SaveChangesAsync();

        return Ok(new { Message = "Family tree deleted successfully." });
    }
}
