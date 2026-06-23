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
[Route("api/[controller]")]
public class TreeController : ControllerBase
{
    private readonly TreelyDbContext _context;

    public TreeController(TreelyDbContext context)
    {
        _context = context;
    }

    private Guid GetCurrentUserId()
    {
        var idStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(idStr, out var id) ? id : Guid.Empty;
    }

    private string GetCurrentUserEmail()
    {
        return User.FindFirst(ClaimTypes.Email)?.Value ?? string.Empty;
    }

    public class CreateTreeDto
    {
        public string Name { get; set; } = string.Empty;
        public bool IsPublic { get; set; } = false;
    }

    public class UpdateTreeGraphDto
    {
        public string TreeGraphJsonData { get; set; } = "[]";
    }

    public class AddCollaboratorDto
    {
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = "visitor"; // owner, editor, visitor
    }

    [HttpGet]
    public async Task<IActionResult> GetTrees()
    {
        var userId = GetCurrentUserId();
        var trees = await _context.FamilyTrees
            .Where(t => t.Collaborators.Any(c => c.UserId == userId))
            .OrderByDescending(t => t.UpdatedAt)
            .ToListAsync();

        return Ok(trees);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTree([FromBody] CreateTreeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest("Tree name is required.");
        }

        var userId = GetCurrentUserId();
        var userEmail = GetCurrentUserEmail();

        var tree = new FamilyTree
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            IsPublic = dto.IsPublic,
            UpdatedAt = DateTime.UtcNow,
            Collaborators = new List<TreeCollaborator>
            {
                new TreeCollaborator
                {
                    UserId = userId,
                    Email = userEmail,
                    Role = "owner"
                }
            },
            TreeGraphJsonData = "[]"
        };

        _context.FamilyTrees.Add(tree);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTree), new { treeId = tree.Id }, tree);
    }

    [AllowAnonymous]
    [HttpGet("{treeId}")]
    public async Task<IActionResult> GetTree(Guid treeId)
    {
        var userId = GetCurrentUserId();
        var tree = await _context.FamilyTrees.FindAsync(treeId);
        if (tree == null)
        {
            return NotFound("Family tree not found.");
        }

        var collaborator = tree.Collaborators.FirstOrDefault(c => c.UserId == userId);
        
        // If the tree is private and the user is not a collaborator, deny access
        if (tree.IsPublic != true && collaborator == null)
        {
            return Forbid("You do not have access to this family tree.");
        }

        var userRole = collaborator?.Role ?? "visitor";

        return Ok(new
        {
            tree.Id,
            tree.Name,
            tree.UpdatedAt,
            tree.TreeGraphJsonData,
            tree.Collaborators,
            IsPublic = tree.IsPublic ?? false,
            UserRole = userRole
        });
    }

    public class UpdatePrivacyDto
    {
        public bool IsPublic { get; set; }
    }

    [AllowAnonymous]
    [HttpGet("public")]
    public async Task<IActionResult> GetPublicTrees()
    {
        var dbTrees = await _context.FamilyTrees
            .Where(t => t.IsPublic == true)
            .OrderByDescending(t => t.UpdatedAt)
            .ToListAsync();

        var trees = dbTrees.Select(t => new
        {
            t.Id,
            t.Name,
            t.UpdatedAt,
            OwnerName = t.Collaborators.FirstOrDefault(c => c.Role == "owner")?.Email ?? "Unknown"
        }).ToList();

        return Ok(trees);
    }

    [HttpPut("{treeId}/privacy")]
    public async Task<IActionResult> UpdateTreePrivacy(Guid treeId, [FromBody] UpdatePrivacyDto dto)
    {
        var userId = GetCurrentUserId();
        var tree = await _context.FamilyTrees.FindAsync(treeId);
        if (tree == null)
        {
            return NotFound("Family tree not found.");
        }

        var collaborator = tree.Collaborators.FirstOrDefault(c => c.UserId == userId);
        if (collaborator == null || collaborator.Role != "owner")
        {
            return Forbid("Only the tree owner can change the privacy settings.");
        }

        tree.IsPublic = dto.IsPublic;
        tree.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(tree);
    }

    [HttpDelete("{treeId}")]
    public async Task<IActionResult> DeleteTree(Guid treeId)
    {
        var userId = GetCurrentUserId();
        var tree = await _context.FamilyTrees.FindAsync(treeId);
        if (tree == null)
        {
            return NotFound("Family tree not found.");
        }

        var collaborator = tree.Collaborators.FirstOrDefault(c => c.UserId == userId);
        if (collaborator == null || collaborator.Role != "owner")
        {
            return Forbid("Only the tree owner can delete the family tree.");
        }

        // Delete associated profiles first to prevent orphaned records in MongoDB
        var profiles = await _context.PersonProfiles
            .Where(p => p.TreeId == treeId)
            .ToListAsync();
        _context.PersonProfiles.RemoveRange(profiles);

        // Delete the tree itself
        _context.FamilyTrees.Remove(tree);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Family tree deleted successfully." });
    }


    [HttpPut("{treeId}")]
    public async Task<IActionResult> UpdateTree(Guid treeId, [FromBody] UpdateTreeGraphDto dto)
    {
        var userId = GetCurrentUserId();
        var tree = await _context.FamilyTrees.FindAsync(treeId);
        if (tree == null)
        {
            return NotFound("Family tree not found.");
        }

        var collaborator = tree.Collaborators.FirstOrDefault(c => c.UserId == userId);
        if (collaborator == null)
        {
            return Forbid("You do not have access to this family tree.");
        }

        if (collaborator.Role != "owner" && collaborator.Role != "editor")
        {
            return Forbid("You do not have permission to edit this family tree.");
        }

        // Parse old and new graphs
        JsonArray oldGraph;
        JsonArray newGraph;
        try
        {
            oldGraph = JsonNode.Parse(tree.TreeGraphJsonData ?? "[]")?.AsArray() ?? new JsonArray();
            newGraph = JsonNode.Parse(dto.TreeGraphJsonData ?? "[]")?.AsArray() ?? new JsonArray();
        }
        catch (System.Text.Json.JsonException)
        {
            return BadRequest("Invalid tree graph JSON payload.");
        }

        var oldNodesDict = new Dictionary<string, JsonObject>();
        foreach (var node in oldGraph)
        {
            if (node is JsonObject obj && obj["id"] != null)
            {
                oldNodesDict[obj["id"]!.ToString()] = obj;
            }
        }

        var newNodesDict = new Dictionary<string, JsonObject>();
        foreach (var node in newGraph)
        {
            if (node is JsonObject obj && obj["id"] != null)
            {
                newNodesDict[obj["id"]!.ToString()] = obj;
            }
        }

        // Find the owner of the tree
        var ownerCollab = tree.Collaborators.FirstOrDefault(c => c.Role == "owner");
        var ownerIdStr = ownerCollab?.UserId.ToString() ?? string.Empty;

        // If Editor, validate deletions and edits
        if (collaborator.Role == "editor")
        {
            var currentUserIdStr = userId.ToString();

            // 1. Check for Deletions
            foreach (var kvp in oldNodesDict)
            {
                var oldNodeId = kvp.Key;
                var oldNodeObj = kvp.Value;

                if (!newNodesDict.ContainsKey(oldNodeId))
                {
                    // Node is deleted
                    var addedBy = oldNodeObj["addedBy"]?.ToString() ?? string.Empty;
                    var actualOwner = string.IsNullOrEmpty(addedBy) ? ownerIdStr : addedBy;

                    if (actualOwner != currentUserIdStr)
                    {
                        return StatusCode(403, "You can only delete nodes that you have added yourself.");
                    }
                }
            }

            // 2. Check for Edits (data object changes)
            foreach (var kvp in newNodesDict)
            {
                var newNodeId = kvp.Key;
                var newNodeObj = kvp.Value;

                if (oldNodesDict.TryGetValue(newNodeId, out var oldNodeObj))
                {
                    var oldDataJson = oldNodeObj["data"]?.ToJsonString() ?? "{}";
                    var newDataJson = newNodeObj["data"]?.ToJsonString() ?? "{}";

                    if (oldDataJson != newDataJson)
                    {
                        // Node data has changed
                        var addedBy = oldNodeObj["addedBy"]?.ToString() ?? string.Empty;
                        var actualOwner = string.IsNullOrEmpty(addedBy) ? ownerIdStr : addedBy;

                        if (actualOwner != currentUserIdStr)
                        {
                            return StatusCode(403, "You can only edit nodes that you have added yourself.");
                        }
                    }
                }
            }
        }

        // 3. Process newGraph to set/preserve addedBy fields
        foreach (var node in newGraph)
        {
            if (node is JsonObject obj && obj["id"] != null)
            {
                var nodeId = obj["id"]!.ToString();
                if (oldNodesDict.TryGetValue(nodeId, out var oldNodeObj))
                {
                    // Preserve old addedBy field
                    var existingAddedBy = oldNodeObj["addedBy"]?.ToString();
                    if (!string.IsNullOrEmpty(existingAddedBy))
                    {
                        obj["addedBy"] = existingAddedBy;
                    }
                    else
                    {
                        // Default legacy nodes to owner
                        obj["addedBy"] = ownerIdStr;
                    }
                }
                else
                {
                    // New node: set addedBy to current user
                    obj["addedBy"] = userId.ToString();
                }
            }
        }

        tree.TreeGraphJsonData = newGraph.ToJsonString();
        tree.UpdatedAt = DateTime.UtcNow;

        _context.Entry(tree).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Tree graph updated successfully.", tree.UpdatedAt });
    }

    [HttpPost("{treeId}/collaborator")]
    public async Task<IActionResult> AddOrUpdateCollaborator(Guid treeId, [FromBody] AddCollaboratorDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email))
        {
            return BadRequest("Collaborator email is required.");
        }

        var currentUserId = GetCurrentUserId();
        var tree = await _context.FamilyTrees.FindAsync(treeId);
        if (tree == null)
        {
            return NotFound("Family tree not found.");
        }

        var currentUserCollab = tree.Collaborators.FirstOrDefault(c => c.UserId == currentUserId);
        if (currentUserCollab == null || currentUserCollab.Role != "owner")
        {
            return Forbid("Only the owner can modify collaborators.");
        }

        var targetEmail = dto.Email.Trim().ToLowerInvariant();
        var targetUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == targetEmail);
        if (targetUser == null)
        {
            return NotFound("User with specified email not found.");
        }

        var role = dto.Role.Trim().ToLowerInvariant();
        if (role != "owner" && role != "editor" && role != "visitor")
        {
            return BadRequest("Invalid role. Role must be 'owner', 'editor', or 'visitor'.");
        }

        var existingCollab = tree.Collaborators.FirstOrDefault(c => c.UserId == targetUser.Id);
        if (existingCollab != null)
        {
            existingCollab.Role = role;
            existingCollab.Email = targetUser.Email;
        }
        else
        {
            tree.Collaborators.Add(new TreeCollaborator
            {
                UserId = targetUser.Id,
                Email = targetUser.Email,
                Role = role
            });
        }

        tree.UpdatedAt = DateTime.UtcNow;
        _context.Entry(tree).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        return Ok(tree.Collaborators);
    }

    [HttpDelete("{treeId}/collaborator/{userId}")]
    public async Task<IActionResult> RemoveCollaborator(Guid treeId, Guid userId)
    {
        var currentUserId = GetCurrentUserId();
        var tree = await _context.FamilyTrees.FindAsync(treeId);
        if (tree == null)
        {
            return NotFound("Family tree not found.");
        }

        var currentUserCollab = tree.Collaborators.FirstOrDefault(c => c.UserId == currentUserId);
        if (currentUserCollab == null || currentUserCollab.Role != "owner")
        {
            return Forbid("Only the owner can remove collaborators.");
        }

        var targetCollab = tree.Collaborators.FirstOrDefault(c => c.UserId == userId);
        if (targetCollab == null)
        {
            return NotFound("Collaborator not found.");
        }

        if (targetCollab.Role == "owner" && tree.Collaborators.Count(c => c.Role == "owner") <= 1)
        {
            return BadRequest("Cannot remove the last owner of the family tree.");
        }

        tree.Collaborators.Remove(targetCollab);
        tree.UpdatedAt = DateTime.UtcNow;

        _context.Entry(tree).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        return Ok(tree.Collaborators);
    }
}
