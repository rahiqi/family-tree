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
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Net.Http;

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
        [JsonPropertyName("id")]
        [JsonConverter(typeof(AnyTypeToStringConverter))]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("first_name")]
        public string FirstName { get; set; } = string.Empty;

        [JsonPropertyName("last_name")]
        public string LastName { get; set; } = string.Empty;

        [JsonPropertyName("username")]
        public string Username { get; set; } = string.Empty;

        [JsonPropertyName("photo_url")]
        public string PhotoUrl { get; set; } = string.Empty;

        [JsonPropertyName("auth_date")]
        [JsonConverter(typeof(AnyTypeToStringConverter))]
        public string AuthDate { get; set; } = string.Empty;

        [JsonPropertyName("hash")]
        public string Hash { get; set; } = string.Empty;

        [JsonPropertyName("isMock")]
        public bool IsMock { get; set; } = false;

        [JsonPropertyName("email")]
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
                var clientId = _config["Authentication:Google:ClientId"] ?? "";
                var payload = await ValidateGoogleTokenManualAsync(dto.IdToken, clientId);
                email = payload.Email;
                firstName = payload.GivenName ?? "";
                lastName = payload.FamilyName ?? "";
                googleId = payload.Subject;
            }
            catch (Exception ex)
            {
                return Unauthorized(new { message = "Invalid Google token: " + ex.Message });
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

    private async Task<GoogleJsonWebSignature.Payload> ValidateGoogleTokenManualAsync(string idToken, string googleClientId)
        {
            var handler = new JwtSecurityTokenHandler();
            if (!handler.CanReadToken(idToken))
            {
                throw new Exception("Invalid token format");
            }
            
            var jwtToken = handler.ReadJwtToken(idToken);
            
            IList<SecurityKey>? keys = null;
            try
            {
                using var client = new HttpClient();
                client.Timeout = TimeSpan.FromSeconds(5);
                var response = await client.GetStringAsync("https://www.googleapis.com/oauth2/v3/certs");
                var jwkSet = new JsonWebKeySet(response);
                keys = jwkSet.GetSigningKeys();
            }
            catch (Exception)
            {
                // Fallback to hardcoded Google keys if offline/geoblocked
                var fallbackJson = @"
                {
                    ""keys"": [
                        {
                            ""use"": ""sig"",
                            ""kid"": ""3035bb86d99f22e613467a6680825eeb0d8139a2"",
                            ""alg"": ""RS256"",
                            ""kty"": ""RSA"",
                            ""e"": ""AQAB"",
                            ""n"": ""9v8ffWKjUXk3eaIkYY6ylAMEvWbSfJiU56Exk9vhWsIkwuSMdr4NOBTPSAj0XRTC7hPLUskkogPCGM0k2JMmbG46OfpNIJyvym0lyPdd_xFoQvp8rVz3dtiGYjJ5-xa2wQGN1M4l0Zq3qZzFCD3-AXeu5PLVzT9N0SdR7jjWeN4QyrY_lQ0sGXDy0fOvbsylhskk-A8HPVuOlPiixb9VSa8E3Aw0LLJcvznObhq1XZfS6_p9BOt2zy5guK8UBSlThYInuFoFaXu4CIaPDLKE0NCxyWMmhOmWtCLblb2WfdPflBP-mUZW8PF7GLTaUw0IEbWef-LSRsS0uk-heISdJw""
                        },
                        {
                            ""kty"": ""RSA"",
                            ""e"": ""AQAB"",
                            ""n"": ""_YiYSsfKSMg0sWfZxdcui2BYLSUlm-wJ9uG-hNuF4LIvgSAmeFNPR0tMw-QHW0bDRITcHzHK1zRAWcbpXgZ7V8A7eA5sH4ivEcqXWCV37vJxx6FEpFllMIW1zXoW3NNuP3ULNGl6mdpxYsNjquOxrypo0Dol7TsS1eLdk2C7SNesmQzI_2j-ZFIMtESZwdIWATV9EiMUgF5riffKb5jyNFMpPRVkI2G8X5ImIkiLPOs663PQPidVijrfOc4nV8PmPCsCqYUWuBkMGgzT6Am-tBem2h_facDhfmdgSCDHnYHi6PxIgyHIQSKU4jtF5sDJGuIORHNZwBUK2VNRcqf8xw"",
                            ""use"": ""sig"",
                            ""alg"": ""RS256"",
                            ""kid"": ""d12978ba4c29ef1154a34e4870c7a3a51d26df10""
                        },
                        {
                            ""use"": ""sig"",
                            ""alg"": ""RS256"",
                            ""kid"": ""8f4730071a99b44ef52dbd6dac2d96af3a7c9b3f"",
                            ""kty"": ""RSA"",
                            ""e"": ""AQAB"",
                            ""n"": ""2eGGURDods69Y0yhtuq-zF3hLp1YotvE4WfmqxUoMXbfNy8lW4xiYVQRMlRDgEQgq01Yzm5vHjHcGWY2Ktgn62N4tWVjfStnlBavsF8MZ4JE7q3csepAzqa068r6Gkuyv7qqutx8G3WdBFhwlK6pwuVo1TNng6cmjumLIev2xy3ES7omfVRneHh-eHuim3ZJ8uSMAG2z4dcLUiTXKDofjkeBRHsgjbOwyHVyuYxnQTthHH8BmomQUu2hIqsHUTeJIEWreyQdjsAulLeFi1Ny3vWd4BQNvviQWjmBXNlCsaXEM5A2U1yvuGp_6zM4KJByEvPKH1cYfaw07xZAXViW2w""
                        },
                        {
                            ""e"": ""AQAB"",
                            ""n"": ""4rY5uwZK1dQ-UVgB5s4NLyC-u5LC2MT7b8GWZztiNgMsp0Nnqx0pM7Ofx0ws32N2aZcx10-J8ydQxnNb9uAcf-7LyhyOIcv_WEyzaSbUAMOgoF-nQmJetckxNg6ekhNfaFcTQS0T-29ql2_CBLIML6CvSh-r0fgWRsqN2ayB7wCl74Gv6OOVbvagUWhj5z2L6o_plmsPDwLVuvA7o3WDEDjoq-IXafRQowj92kQUenrOKD4YCopuLIBhel6VH8doFRNZ6KISQhMcOivWaLU_UtKKAMloGJieTf_3r-_nErs2h5wB7T7FrMCScmO7mvFQXKh8_4P-MlbfgS9CUvQksw"",
                            ""kty"": ""RSA"",
                            ""kid"": ""f10f87405a979c1df36df26606734f33cd85c271"",
                            ""alg"": ""RS256"",
                            ""use"": ""sig""
                        }
                    ]
                }";
                var jwkSet = new JsonWebKeySet(fallbackJson);
                keys = jwkSet.GetSigningKeys();
            }
            
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuers = new[] { "accounts.google.com", "https://accounts.google.com" },
                ValidateAudience = true,
                ValidAudiences = new[] { googleClientId },
                ValidateLifetime = true,
                IssuerSigningKeys = keys,
                ClockSkew = TimeSpan.FromMinutes(5)
            };
            
            handler.ValidateToken(idToken, validationParameters, out var validatedToken);
            
            var payload = new GoogleJsonWebSignature.Payload
            {
                Email = jwtToken.Claims.FirstOrDefault(c => c.Type == "email" || c.Type == ClaimTypes.Email)?.Value ?? string.Empty,
                GivenName = jwtToken.Claims.FirstOrDefault(c => c.Type == "given_name" || c.Type == ClaimTypes.GivenName)?.Value ?? string.Empty,
                FamilyName = jwtToken.Claims.FirstOrDefault(c => c.Type == "family_name" || c.Type == ClaimTypes.Surname)?.Value ?? string.Empty,
                Subject = jwtToken.Claims.FirstOrDefault(c => c.Type == "sub" || c.Type == ClaimTypes.NameIdentifier)?.Value ?? string.Empty
            };
            
            return payload;
        }
    }

public class AnyTypeToStringConverter : JsonConverter<string>
{
    public override string Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.String)
        {
            return reader.GetString() ?? string.Empty;
        }
        if (reader.TokenType == JsonTokenType.Number)
        {
            if (reader.TryGetInt64(out long l))
            {
                return l.ToString();
            }
            if (reader.TryGetDouble(out double d))
            {
                return d.ToString();
            }
        }
        if (reader.TokenType == JsonTokenType.True) return "true";
        if (reader.TokenType == JsonTokenType.False) return "false";
        
        using (JsonDocument document = JsonDocument.ParseValue(ref reader))
        {
            return document.RootElement.GetRawText();
        }
    }

    public override void Write(Utf8JsonWriter writer, string value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value);
    }
}
