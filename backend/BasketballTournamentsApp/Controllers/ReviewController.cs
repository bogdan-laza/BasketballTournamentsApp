using BasketballTournamentsApp.Models;
using BasketballTournamentsApp.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BasketballTournamentsApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewController : ControllerBase
    {
        private readonly ReviewService _reviewService;

        public ReviewController(ReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        [HttpGet]
        public async Task<IActionResult> GetPagedReviewsAsync(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string sortBy = "ReviewDate",
            [FromQuery] string sortOrder = "desc",
            [FromQuery] int? reviewedId = null)
        {
            var result = await _reviewService.GetPagedReviewsAsync(page, pageSize, sortBy, sortOrder, reviewedId);
            return Ok(result);
        }

        [HttpGet("stats/{userId}")]
        public async Task<IActionResult> GetUserReviewStatsAsync([FromRoute] int userId)
        {
            try
            {
                var stats = await _reviewService.GetUserReviewStatsAsync(userId);
                return Ok(stats);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize] 
        [HttpPost]
        public async Task<IActionResult> AddReviewAsync([FromBody] Review review)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                await _reviewService.AddReviewAsync(review);
                return Ok(new { message = "Review added successfully!" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize]
        [HttpPut]
        public async Task<IActionResult> UpdateReviewAsync([FromBody] Review review)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                await _reviewService.UpdateReviewAsync(review);
                return Ok(new { message = "Review updated successfully!" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize]
        [HttpDelete("{reviewerId}/{reviewedId}")]
        public async Task<IActionResult> DeleteReviewAsync([FromRoute] int reviewerId, [FromRoute] int reviewedId)
        {
            try
            {
                await _reviewService.DeleteReviewAsync(reviewerId, reviewedId);
                return Ok(new { message = "Review deleted successfully!" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}