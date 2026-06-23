using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using back.Data;
using back.Models;
using Google.Apis.Auth;
using System.Security.Cryptography;

namespace back.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly TreelyDbContext _context;
    private readonly IConfiguration _config;

    public AuthController(TreelyDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    public class RegisterDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
    }

    public class LoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest("Email and Password are required.");
        }

        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        if (await _context.Users.AnyAsync(u => u.Email == normalizedEmail))
        {
            return BadRequest("User with this email already exists.");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var token = GenerateJwtToken(user);
        return Ok(new { token, user = new { user.Id, user.Email, user.FirstName, user.LastName } });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest("Email and Password are required.");
        }

        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            return Unauthorized("Invalid email or password.");
        }

        var token = GenerateJwtToken(user);
        return Ok(new { token, user = new { user.Id, user.Email, user.FirstName, user.LastName } });
    }

    private string GenerateJwtToken(User user)
    {
        var jwtKey = _config["Jwt:Key"] ?? "SuperSecretSecureKeyForTreelyApplication2026!";
        var jwtIssuer = _config["Jwt:Issuer"] ?? "treely-api";
        var jwtAudience = _config["Jwt:Audience"] ?? "treely-app";
        var duration = _config.GetValue<int>("Jwt:DurationMinutes", 120);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim("FirstName", user.FirstName),
            new Claim("LastName", user.LastName)
        };

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(duration),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public class GoogleAuthDto
    {
        public string IdToken { get; set; } = string.Empty;
        public bool IsMock { get; set; } = false;
        public string? MockEmail { get; set; }
        public string? MockFirstName { get; set; }
        public string? MockLastName { get; set; }
    }

    public class TelegramAuthDto
    {
        public string Id { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string PhotoUrl { get; set; } = string.Empty;
        public string AuthDate { get; set; } = string.Empty;
        public string Hash { get; set; } = string.Empty;
        public bool IsMock { get; set; } = false;
        public string? Email { get; set; } // Provided when completing registration
    }

    [HttpGet("config")]
    public IActionResult GetConfig()
    {
        return Ok(new
        {
            googleClientId = _config["Authentication:Google:ClientId"] ?? "",
            telegramBotUsername = _config["Authentication:Telegram:BotUsername"] ?? ""
        });
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleAuthDto dto)
    {
        var env = HttpContext.RequestServices.GetService<IWebHostEnvironment>();
        string email = string.Empty;
        string firstName = string.Empty;
        string lastName = string.Empty;
        string googleId = string.Empty;

        if (dto.IsMock && env?.EnvironmentName == "Development")
        {
            email = dto.MockEmail ?? "mock@google.local";
            firstName = dto.MockFirstName ?? "Mock";
            lastName = dto.MockLastName ?? "GoogleUser";
            googleId = "mock-google-id-" + email;
        }
        else
        {
            try
            {
                var clientId = _config["Authentication:Google:ClientId"];
                var settings = new GoogleJsonWebSignature.ValidationSettings()
                {
                    Audience = new[] { clientId }
                };
                var payload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken, settings);
                email = payload.Email;
                firstName = payload.GivenName ?? "";
                lastName = payload.FamilyName ?? "";
                googleId = payload.Subject;
            }
            catch (InvalidJwtException)
            {
                return Unauthorized(new { message = "Invalid Google token" });
            }
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.GoogleId == googleId || u.Email == email);
        if (user == null)
        {
            user = new User
            {
                Id = Guid.NewGuid(),
                Email = email,
                FirstName = firstName,
                LastName = lastName,
                PasswordHash = "",
                GoogleId = googleId,
                CreatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);
        }
        else
        {
            if (string.IsNullOrEmpty(user.GoogleId))
            {
                user.GoogleId = googleId;
                _context.Users.Update(user);
            }
        }

        await _context.SaveChangesAsync();

        var token = GenerateJwtToken(user);
        return Ok(new { token, user = new { user.Id, user.Email, user.FirstName, user.LastName } });
    }

    [HttpPost("telegram")]
    public async Task<IActionResult> TelegramLogin([FromBody] TelegramAuthDto dto)
    {
        var env = HttpContext.RequestServices.GetService<IWebHostEnvironment>();
        string telegramId = dto.Id;

        if (!dto.IsMock || env?.EnvironmentName != "Development")
        {
            var botToken = _config["Authentication:Telegram:BotToken"];
            if (string.IsNullOrEmpty(botToken)) return StatusCode(500, new { message = "Telegram bot token not configured" });

            // Validate hash
            var dataCheckPairs = new List<string>();
            if (!string.IsNullOrEmpty(dto.AuthDate)) dataCheckPairs.Add($"auth_date={dto.AuthDate}");
            if (!string.IsNullOrEmpty(dto.FirstName)) dataCheckPairs.Add($"first_name={dto.FirstName}");
            if (!string.IsNullOrEmpty(dto.Id)) dataCheckPairs.Add($"id={dto.Id}");
            if (!string.IsNullOrEmpty(dto.LastName)) dataCheckPairs.Add($"last_name={dto.LastName}");
            if (!string.IsNullOrEmpty(dto.PhotoUrl)) dataCheckPairs.Add($"photo_url={dto.PhotoUrl}");
            if (!string.IsNullOrEmpty(dto.Username)) dataCheckPairs.Add($"username={dto.Username}");

            dataCheckPairs.Sort(StringComparer.Ordinal);
            var dataCheckString = string.Join("\n", dataCheckPairs);

            using var sha256 = SHA256.Create();
            var secretKey = sha256.ComputeHash(Encoding.UTF8.GetBytes(botToken));

            using var hmac = new HMACSHA256(secretKey);
            var computedHashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(dataCheckString));
            var computedHash = BitConverter.ToString(computedHashBytes).Replace("-", "").ToLowerInvariant();

            if (computedHash != dto.Hash)
            {
                return Unauthorized(new { message = "Invalid Telegram payload signature" });
            }

            // Optional: Check auth_date to prevent replay attacks (e.g., within 24 hours)
            if (long.TryParse(dto.AuthDate, out long unixAuthDate))
            {
                var authDateTime = DateTimeOffset.FromUnixTimeSeconds(unixAuthDate).UtcDateTime;
                if ((DateTime.UtcNow - authDateTime).TotalHours > 24)
                {
                    return Unauthorized(new { message = "Telegram payload expired" });
                }
            }
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.TelegramId == telegramId);
        
        if (user != null)
        {
            var token = GenerateJwtToken(user);
            return Ok(new { token, user = new { user.Id, user.Email, user.FirstName, user.LastName } });
        }
        else
        {
            // User doesn't exist. Check if email was provided.
            if (string.IsNullOrEmpty(dto.Email))
            {
                return Ok(new { requires_email = true, message = "Email required to complete registration" });
            }

            // Check if email is already in use
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (existingUser != null)
            {
                return BadRequest(new { message = "Email is already in use" });
            }

            user = new User
            {
                Id = Guid.NewGuid(),
                Email = dto.Email,
                FirstName = dto.FirstName ?? "TelegramUser",
                LastName = dto.LastName ?? "",
                PasswordHash = "",
                TelegramId = telegramId,
                CreatedAt = DateTime.UtcNow
            };
            
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var token = GenerateJwtToken(user);
            return Ok(new { token, user = new { user.Id, user.Email, user.FirstName, user.LastName } });
        }
    }
}
