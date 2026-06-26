using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace back.Models;

public class FamilyParty
{
    [Key]
    public Guid Id { get; set; }
    public Guid TreeId { get; set; }
    public Guid CreatorId { get; set; } // User ID of the creator
    
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty; // Private address or coordinates
    public string Date { get; set; } = string.Empty; // Format: YYYY-MM-DD or YYYY/MM/DD
    public string Time { get; set; } = string.Empty; // Format: HH:mm
    
    public bool IsPublic { get; set; } = true; // Open to all collaborators
    public List<Guid> AllowedMemberIds { get; set; } = new(); // If IsPublic is false, only these users can see it
    
    public string Recurrence { get; set; } = "one-time"; // one-time, yearly, monthly
    
    public bool NeedsSponsor { get; set; } = false;
    public decimal TargetAmount { get; set; } = 0;
    
    public bool OpenRegistration { get; set; } = false; // Anybody paying/sponsoring can attend
    
    public List<PartySponsorship> Sponsorships { get; set; } = new();
    public List<PartyParticipant> Participants { get; set; } = new();
    public List<MediaAsset> PhotoAlbum { get; set; } = new();
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class PartySponsorship
{
    public Guid UserId { get; set; }
    public string SponsorName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime PledgedAt { get; set; } = DateTime.UtcNow;
}

public class PartyParticipant
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = "attendee"; // attendee, organizer, etc.
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}
