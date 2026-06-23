using System;
using System.ComponentModel.DataAnnotations;

namespace back.Models;

public class User
{
    [Key]
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? GoogleId { get; set; }
    public string? TelegramId { get; set; }
}
