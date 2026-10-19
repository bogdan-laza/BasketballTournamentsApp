using BasketballTournamentsApp.Models;
using BasketballTournamentsApp.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace BasketballTournamentsApp.Controllers
{
    public class ChangePasswordDto
    {
        public string OldPassword { get; set; }
        public string NewPassword { get; set; }
    }

    [ApiController]
    [Route("api/[Controller]")]
    public class UserController:ControllerBase
    {
        private readonly UserService _userService;
        public UserController(UserService userService)
        {
            _userService = userService;
        }

        //[Authorize(Roles ="Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAllUsersAsync(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string sortBy = "CreatedAt",
        [FromQuery] string sortOrder = "desc",
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? county = null,
        [FromQuery] string? city = null,
        [FromQuery] string? personRole = null,
        [FromQuery] int? playerLevel=null,
        [FromQuery] int? excludeUserId = null)
        {
            var paged = await _userService.GetPagedUsersAsync(page, pageSize, sortBy, sortOrder,
                searchTerm, county, city, personRole, playerLevel, excludeUserId);
            return Ok(paged);
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetUserByIdAsync([FromRoute] int userId)
        {
            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
                return NotFound();
            return Ok(user);
        }

        //[Authorize]
        [HttpPost]
        public async Task<IActionResult> AddUserAsync([FromBody] User user)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }
            await _userService.AddUserAsync(user);
            return Ok("User created successfully");
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUserAsync([FromRoute] int id)
        {
            var loggedInUserId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (loggedInUserId != id && !User.IsInRole("Admin"))
                return Forbid("You can only delete your own profile!");

            await _userService.DeleteUserAsync(id);
            return Ok(new { message = $"User with id {id} deleted successfully!" });
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUserAsync([FromRoute] int id, [FromBody] User user)
        {
            var loggedInUserId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (loggedInUserId != user.UserId && !User.IsInRole("Admin"))
                return Forbid("You can only update your own profile!");

            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            if (id != user.UserId)
            {
                return BadRequest("User ID mismatch!");
            }

            await _userService.UpdateUserAsync(user);
            return Ok(new { message = $"User with id {id} updated successfully!" });
        }

        [HttpPut("{userId}/profile-photo")]
        public async Task<IActionResult> UploadProfilePhoto(int userId, [FromBody] string newProfileImage)
        {
                await _userService.UpdateProfileImageAsync(userId, newProfileImage);
                return Ok(new { message = "Photo updated successfully!" });
        }

        [Authorize] 
        [HttpPost("{userId}/change-password")]
        public async Task<IActionResult> ChangePassword(int userId, [FromBody] ChangePasswordDto request)
        {
                var tokenUserId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
                if (tokenUserId != userId)
                {
                    return Forbid("You can only change your own password.");
                }

                await _userService.UpdatePasswordAsync(userId, request.OldPassword, request.NewPassword);

                return Ok(new { message = "Password updated successfully." });   
        }
    }
}
