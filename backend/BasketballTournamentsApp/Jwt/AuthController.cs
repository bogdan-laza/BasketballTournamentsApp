using BasketballTournamentsApp.Models;
using BasketballTournamentsApp.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace BasketballTournamentsApp.Jwt
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly UserService _userService;
        private readonly IEmailService _emailService;

        public AuthController(IAuthService authService, UserService userService, IEmailService emailService) {
            _authService = authService;
            _userService = userService;
            _emailService = emailService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            var user = await _userService.GetUserByUsernameAsync(req.Username);

            if (user == null) return Unauthorized(new { message = "Invalid credentials" });

            if (!user.IsEmailVerified)
            {
                return BadRequest(new
                {
                    message = "EmailNotVerified",
                    email = user.Email 
                });
            }
            var tokens = await _authService.AuthenticateAsync(req.Username, req.Password);
            if (tokens == null) return Unauthorized(new { message = "Invalid credentials" });
            return Ok(tokens);
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshRequest req)
        {
            var tokens = await _authService.RefreshAsync(req.RefreshToken);
            if (tokens == null) return Unauthorized(new { message = "Invalid or expired refresh token" });
            return Ok(tokens);
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Revoke()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            await (_authService).RevokeRefreshTokenAsync(userId);
            return NoContent();
        }

        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailDTO request)
        {
            var user = await _userService.GetUserByEmailAsync(request.Email);

            if (user == null)
                return BadRequest(new { message = "User not found!" });

            if (user.IsEmailVerified)
                return BadRequest(new { message = "Email is already verifies!" });

            if (user.VerificationCode != request.Code)
                return BadRequest(new { message = "Invalid verification code!" });

            if (user.VerificationCodeExpires < DateTime.UtcNow)
                return BadRequest(new { message = "Verification code has expired! Click resend code!" });

            await _userService.VerifyUserEmailAsync(user.UserId);
            return Ok(new { message = "Email verified successfully! You can now log in." });
        }

        [HttpPost("resend-code")]
        public async Task<IActionResult> ResendCode([FromBody] ResendCodeDTO request)
        {
            var user = await _userService.GetUserByEmailAsync(request.Email);

            if (user == null)
                return BadRequest(new { message = "User not found!" });

            if (user.IsEmailVerified)
                return BadRequest(new { message = "Email is already verifies!" });

            var newCode = new Random().Next(100000, 999999).ToString();
            var expiration = DateTime.UtcNow.AddMinutes(15);

            await _userService.SetVerificationCodeAsync(user.UserId, newCode, expiration);

            string emailBody = $@"
        <div style='font-family: Arial, sans-serif; text-align: center; color: #333;'>
            <h2>Welcome to HoopZone! 🏀</h2>
            <p>We are thrilled to have you. Please verify your email address to complete your registration.</p>
            <h1 style='color: #f97316; font-size: 36px; letter-spacing: 5px;'>{newCode}</h1>
            <p>This code will expire in 15 minutes.</p>
        </div>";

            await _emailService.SendEmailAsync(user.Email, "Verify Your HoopZone Account", emailBody);

            return Ok(new { message = "A new verification code has been sent to your email." });
        }
    }

}
