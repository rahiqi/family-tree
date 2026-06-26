using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace back.Models;

public class PersonProfile
{
    [Key]
    public string Id { get; set; } = string.Empty; // matches string UUID from family-chart
    public Guid TreeId { get; set; }
    
    public string? Biography { get; set; }
    public string? AvatarUrl { get; set; }
    public List<MediaAsset> PhotoAlbum { get; set; } = new();
    public List<TimelineEvent> TimelineEvents { get; set; } = new();
    public List<ChangeLogEntry> ChangeLogs { get; set; } = new();
}

public class MediaAsset
{
    public string Url { get; set; } = string.Empty;
    public string? Caption { get; set; }
}

public class TimelineEvent
{
    public string Id { get; set; } = string.Empty; // UUID generated on client or server
    public string Date { get; set; } = string.Empty; // Persian/English date string
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = "custom"; // birthday, education, career, marriage, death, custom
}

public class ChangeLogEntry
{
    public string ChangedBy { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
