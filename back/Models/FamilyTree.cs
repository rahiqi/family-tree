using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace back.Models;

public class FamilyTree
{
    [Key]
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<TreeCollaborator> Collaborators { get; set; } = new();

    public string TreeGraphJsonData { get; set; } = "[]";
}

public class TreeCollaborator
{
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "visitor"; // owner, editor, visitor
}
