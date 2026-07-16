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

    private async Task<string?> GetUserRoleAsync(FamilyTree tree, Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user != null && user.IsSuperAdmin) return "owner";

        var collaborator = tree.Collaborators.FirstOrDefault(c => c.UserId == userId);
        return collaborator?.Role;
    }

    private async Task<bool> IsSuperAdminAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        return user?.IsSuperAdmin ?? false;
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

        var userRole = await GetUserRoleAsync(tree, userId);
        
        // If the tree is private and the user is not a collaborator, deny access
        if (tree.IsPublic != true && userRole == null)
        {
            return Forbid("You do not have access to this family tree.");
        }

        return Ok(new
        {
            tree.Id,
            tree.Name,
            tree.UpdatedAt,
            tree.TreeGraphJsonData,
            tree.Collaborators,
            IsPublic = tree.IsPublic ?? false,
            UserRole = userRole ?? "visitor"
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

        var userRole = await GetUserRoleAsync(tree, userId);
        if (userRole != "owner")
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

        var userRole = await GetUserRoleAsync(tree, userId);
        if (userRole != "owner")
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

        var userRole = await GetUserRoleAsync(tree, userId);
        if (userRole == null)
        {
            return Forbid("You do not have access to this family tree.");
        }

        if (userRole != "owner" && userRole != "editor")
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

        // 1. Get editor name
        var userObj = await _context.Users.FindAsync(userId);
        var editorName = userObj != null ? userObj.FirstName : "Someone";
        if (string.IsNullOrEmpty(editorName)) editorName = userObj?.Email ?? "Someone";

        // 2. Map of node names for easy lookup
        var nameMap = new Dictionary<string, string>();
        
        string GetNodeName(string id, Dictionary<string, JsonObject> newNodes, Dictionary<string, JsonObject> oldNodes)
        {
            if (nameMap.TryGetValue(id, out var cachedName)) return cachedName;

            JsonObject? node = null;
            if (newNodes.TryGetValue(id, out var n1)) node = n1;
            else if (oldNodes.TryGetValue(id, out var n2)) node = n2;

            if (node == null) return "Unknown Person";

            var fName = node["data"]?["first name"]?.ToString() ?? node["data"]?["firstName"]?.ToString() ?? string.Empty;
            var lName = node["data"]?["last name"]?.ToString() ?? node["data"]?["lastName"]?.ToString() ?? string.Empty;
            var fullName = $"{fName} {lName}".Trim();
            var result = string.IsNullOrEmpty(fullName) ? "Unnamed Person" : fullName;
            nameMap[id] = result;
            return result;
        }

        // 3. Track Changes
        var relTypes = new[] { "parents", "spouses", "children" };
        var relNamesEn = new Dictionary<string, (string Singular, string Plural)>()
        {
            { "parents", ("parent", "parents") },
            { "spouses", ("spouse", "spouses") },
            { "children", ("child", "children") }
        };

        foreach (var kvp in newNodesDict)
        {
            var nodeId = kvp.Key;
            var newNodeObj = kvp.Value;

            var changes = new List<string>();

            if (oldNodesDict.TryGetValue(nodeId, out var oldNodeObj))
            {
                // Node existed: Check for edits
                var oldFirstName = oldNodeObj["data"]?["first name"]?.ToString() ?? oldNodeObj["data"]?["firstName"]?.ToString() ?? string.Empty;
                var newFirstName = newNodeObj["data"]?["first name"]?.ToString() ?? newNodeObj["data"]?["firstName"]?.ToString() ?? string.Empty;
                var oldLastName = oldNodeObj["data"]?["last name"]?.ToString() ?? oldNodeObj["data"]?["lastName"]?.ToString() ?? string.Empty;
                var newLastName = newNodeObj["data"]?["last name"]?.ToString() ?? newNodeObj["data"]?["lastName"]?.ToString() ?? string.Empty;

                if (oldFirstName != newFirstName || oldLastName != newLastName)
                {
                    var oldFullName = $"{oldFirstName} {oldLastName}".Trim();
                    if (string.IsNullOrEmpty(oldFullName)) oldFullName = "Unnamed Person";
                    var newFullName = $"{newFirstName} {newLastName}".Trim();
                    if (string.IsNullOrEmpty(newFullName)) newFullName = "Unnamed Person";

                    changes.Add($"changed name from '{oldFullName}' to '{newFullName}'");
                }

                // Gender change
                var oldGender = oldNodeObj["data"]?["gender"]?.ToString() ?? string.Empty;
                var newGender = newNodeObj["data"]?["gender"]?.ToString() ?? string.Empty;
                if (oldGender != newGender && !string.IsNullOrEmpty(oldGender))
                {
                    changes.Add($"changed gender from '{oldGender}' to '{newGender}'");
                }

                // Birthday change
                var oldBday = oldNodeObj["data"]?["birthday"]?.ToString() ?? string.Empty;
                var newBday = newNodeObj["data"]?["birthday"]?.ToString() ?? string.Empty;
                if (oldBday != newBday && !string.IsNullOrEmpty(oldBday))
                {
                    changes.Add($"changed birthday from '{oldBday}' to '{newBday}'");
                }

                // Compare relationships
                foreach (var relType in relTypes)
                {
                    var oldRels = oldNodeObj["rels"]?.AsObject()?[relType]?.AsArray()?.Select(x => x?.ToString() ?? string.Empty)?.Where(x => !string.IsNullOrEmpty(x))?.ToList() ?? new List<string>();
                    var newRels = newNodeObj["rels"]?.AsObject()?[relType]?.AsArray()?.Select(x => x?.ToString() ?? string.Empty)?.Where(x => !string.IsNullOrEmpty(x))?.ToList() ?? new List<string>();

                    var added = newRels.Except(oldRels).ToList();
                    var removed = oldRels.Except(newRels).ToList();

                    foreach (var relId in added)
                    {
                        var targetName = GetNodeName(relId, newNodesDict, oldNodesDict);
                        changes.Add($"added {relNamesEn[relType].Singular} '{targetName}'");
                    }

                    foreach (var relId in removed)
                    {
                        var targetName = GetNodeName(relId, newNodesDict, oldNodesDict);
                        changes.Add($"removed {relNamesEn[relType].Singular} '{targetName}'");
                    }
                }
            }
            else
            {
                // New Node added
                changes.Add("created this family member node");
            }

            if (changes.Count > 0)
            {
                var isNew = false;
                var profile = await _context.PersonProfiles.FirstOrDefaultAsync(p => p.TreeId == treeId && p.Id == nodeId);
                if (profile == null)
                {
                    profile = new PersonProfile
                    {
                        Id = nodeId,
                        TreeId = treeId,
                        Biography = string.Empty,
                        AvatarUrl = string.Empty,
                        PhotoAlbum = new(),
                        TimelineEvents = new(),
                        ChangeLogs = new()
                    };
                    _context.PersonProfiles.Add(profile);
                    isNew = true;
                }

                if (profile.ChangeLogs == null)
                {
                    profile.ChangeLogs = new List<ChangeLogEntry>();
                }

                foreach (var changeDesc in changes)
                {
                    profile.ChangeLogs.Add(new ChangeLogEntry
                    {
                        ChangedBy = editorName,
                        Description = changeDesc,
                        Timestamp = DateTime.UtcNow
                    });
                }

                // Keep only the last 10 logs
                profile.ChangeLogs = profile.ChangeLogs.OrderByDescending(c => c.Timestamp).Take(10).ToList();
                
                if (!isNew)
                {
                    _context.Entry(profile).State = EntityState.Modified;
                }
            }
        }

        // 4. Process newGraph to set/preserve addedBy fields
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

        var currentUserRole = await GetUserRoleAsync(tree, currentUserId);
        if (currentUserRole != "owner")
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

        var currentUserRole = await GetUserRoleAsync(tree, currentUserId);
        if (currentUserRole != "owner")
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

    [HttpGet("{treeId}/history")]
    public async Task<IActionResult> GetTreeHistory(Guid treeId)
    {
        var userId = GetCurrentUserId();
        var tree = await _context.FamilyTrees.FindAsync(treeId);
        if (tree == null)
        {
            return NotFound("Family tree not found.");
        }

        var userRole = await GetUserRoleAsync(tree, userId);
        if (tree.IsPublic != true && userRole == null)
        {
            return Forbid("You do not have access to this family tree.");
        }

        // Parse tree graph data to map person IDs to names so we can display target names in logs
        var personMap = new Dictionary<string, string>();
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
                    personMap[id] = string.IsNullOrEmpty(fullName) ? "Unnamed Person" : fullName;
                }
            }
        }
        catch (Exception)
        {
            // Ignore parse errors
        }

        // Fetch all profiles for this tree
        var profiles = await _context.PersonProfiles
            .Where(p => p.TreeId == treeId)
            .ToListAsync();

        var historyList = new List<object>();

        foreach (var profile in profiles)
        {
            personMap.TryGetValue(profile.Id, out var targetPersonName);
            if (string.IsNullOrEmpty(targetPersonName)) targetPersonName = "Removed Member";

            foreach (var log in profile.ChangeLogs)
            {
                historyList.Add(new
                {
                    log.ChangedBy,
                    log.Description,
                    log.Timestamp,
                    PersonId = profile.Id,
                    PersonName = targetPersonName
                });
            }
        }

        // Sort by timestamp descending
        var sortedHistory = historyList
            .OrderByDescending(h => ((dynamic)h).Timestamp)
            .Take(30)
            .ToList();

        return Ok(sortedHistory);
    }
}
