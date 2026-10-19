using BasketballTournamentsApp.Extensions;
using BasketballTournamentsApp.Models;
using Microsoft.Data.SqlClient;
using System.Data;

namespace BasketballTournamentsApp.Services
{
    public class ReviewService
    {
        private readonly SqlConfig _config;
        private readonly UserService _userService;

        public ReviewService(SqlConfig config, UserService userService)
        {
            _config = config;
            _userService = userService;
        }

        public async Task<PagedResult<Review>> GetPagedReviewsAsync(
   int page, int pageSize, string sortBy, string sortOrder, int? ReviewedId)
        {
            if (page < 1) page = 1;
            const int maxPageSize = 100;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > maxPageSize) pageSize = maxPageSize;

            var allowedSortBy = new[] { "ReviewDate", "SportsmanshipRating", "ReliabilityRating" };
            if (!allowedSortBy.Contains(sortBy, StringComparer.OrdinalIgnoreCase))
                sortBy = "ReviewDate";

            if (sortOrder != "asc" && sortOrder != "desc")
                sortOrder = "desc";

            var items = new List<Review>();
            int totalCount = 0;

            using (var conn = new SqlConnection(_config.ConnectionString))
            using (var cmd = new SqlCommand("GET_REVIEWS_PAGED_SORT_FILTER", conn))
            {
                cmd.CommandType = System.Data.CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Page", page);
                cmd.Parameters.AddWithValue("@PageSize", pageSize);
                cmd.Parameters.AddWithValue("@SortBy", sortBy);
                cmd.Parameters.AddWithValue("@SortOrder", sortOrder);
                cmd.Parameters.AddWithValue("@ReviewedId", (object?)ReviewedId ?? DBNull.Value);
                var outParam = new SqlParameter("@TotalCount", SqlDbType.Int)
                {
                    Direction = ParameterDirection.Output
                };
                cmd.Parameters.Add(outParam);

                await conn.OpenAsync();
                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        items.Add(new Review
                        {
                            ReviewerId = reader.GetInt32(reader.GetOrdinal("ReviewerId")),
                            ReviewedId = reader.GetInt32(reader.GetOrdinal("ReviewedId")),
                            TournamentId = reader.GetInt32(reader.GetOrdinal("TournamentId")),
                            ReviewDate = reader.IsDBNull(reader.GetOrdinal("ReviewDate")) ? null : reader.GetDateTime(reader.GetOrdinal("ReviewDate")),
                            ReviewText = reader.IsDBNull(reader.GetOrdinal("ReviewText")) ? null : reader.GetString(reader.GetOrdinal("ReviewText")),
                            SportsmanshipRating = reader.GetInt32(reader.GetOrdinal("SportsmanshipRating")),
                            ReliabilityRating = reader.GetInt32(reader.GetOrdinal("ReliabilityRating")),
                            ReviewedLevel = reader.GetInt32(reader.GetOrdinal("ReviewedLevel"))
                        });
                    }
                }
                totalCount = (int)(outParam.Value ?? 0);
            }



            return new PagedResult<Review>
            {
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                Items = items
            };
        }

        public async Task AddReviewAsync(Review review)
        {
            if (await _userService.CheckIfUserExistsByIdAsync(review.ReviewerId) == false)
                throw new ArgumentException("The reviewer does not exist!");

            if (await _userService.CheckIfUserExistsByIdAsync(review.ReviewedId) == false)
                throw new ArgumentException("The reviewed does not exist!");

            using (var conn = new SqlConnection(_config.ConnectionString))
            using (var cmd = new SqlCommand("ADD_REVIEW", conn))
            {
                cmd.CommandType = System.Data.CommandType.StoredProcedure;
                await conn.OpenAsync();
                cmd.Parameters.AddWithValue("@ReviewerId", review.ReviewerId);
                cmd.Parameters.AddWithValue("@ReviewedId", review.ReviewedId);
                cmd.Parameters.AddWithValue("@TournamentId", review.TournamentId);
                cmd.Parameters.AddWithValue("@ReviewDate", (object?)review.ReviewDate ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ReviewText", (object?)review.ReviewText ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@SportsmanshipRating", review.SportsmanshipRating);
                cmd.Parameters.AddWithValue("@ReliabilityRating", review.ReliabilityRating);
                cmd.Parameters.AddWithValue("@ReviewedLevel", review.ReviewedLevel);

                await cmd.ExecuteNonQueryAsync();
            }
        }

        public async Task DeleteReviewAsync(int reviewerId, int reviewedId)
        {
            using (var conn = new SqlConnection(_config.ConnectionString))
            using (var cmd = new SqlCommand("DELETE_REVIEW", conn))
            {
                cmd.CommandType = System.Data.CommandType.StoredProcedure;
                await conn.OpenAsync();
                cmd.Parameters.AddWithValue("@ReviewerId", reviewerId);
                cmd.Parameters.AddWithValue("@ReviewedId", reviewedId);
                var rowsAffected = await cmd.ExecuteNonQueryAsync();
                if (rowsAffected == 0)
                    throw new ArgumentException($"The review with ReviewerId {reviewerId} and ReviewedId {reviewedId} does not exist!");
            }
        }

        public async Task UpdateReviewAsync(Review review)
        {
            if (await _userService.CheckIfUserExistsByIdAsync(review.ReviewerId) == false)
                throw new ArgumentException("The reviewer does not exist!");

            if (await _userService.CheckIfUserExistsByIdAsync(review.ReviewedId) == false)
                throw new ArgumentException("The reviewed does not exist!");

            using (var conn = new SqlConnection(_config.ConnectionString))
            using (var cmd = new SqlCommand("UPDATE_REVIEW", conn))
            {
                cmd.CommandType = System.Data.CommandType.StoredProcedure;
                await conn.OpenAsync();
                cmd.Parameters.AddWithValue("@ReviewerId", review.ReviewerId);
                cmd.Parameters.AddWithValue("@ReviewedId", review.ReviewedId);
                cmd.Parameters.AddWithValue("@TournamentId", review.TournamentId);
                cmd.Parameters.AddWithValue("@ReviewDate", (object?)review.ReviewDate ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ReviewText", (object?)review.ReviewText ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@SportsmanshipRating", review.SportsmanshipRating);
                cmd.Parameters.AddWithValue("@ReliabilityRating", review.ReliabilityRating);
                cmd.Parameters.AddWithValue("@ReviewedLevel", review.ReviewedLevel);

                var rowsAffected = await cmd.ExecuteNonQueryAsync();
                if (rowsAffected == 0)
                    throw new ArgumentException($"The review with ReviewerId {review.ReviewerId} and ReviewedId {review.ReviewedId} does not exist!");
            }
        }


        public async Task<UserReviewStats> GetUserReviewStatsAsync(int userId)
        {
            if (await _userService.CheckIfUserExistsByIdAsync(userId) == false)
                throw new ArgumentException("The user does not exist!");

            using (var conn = new SqlConnection(_config.ConnectionString))
            using (var cmd = new SqlCommand("GET_USER_REVIEW_STATS", conn))
            {
                cmd.CommandType = System.Data.CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@UserId", userId);

                await conn.OpenAsync();

                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    if (await reader.ReadAsync())
                    {
                        return new UserReviewStats
                        {
                            NumberOfReviews = reader.GetInt32(reader.GetOrdinal("NumberOfReviews")),
                            AvgSportsmanship = reader.GetDecimal(reader.GetOrdinal("AvgSportsmanship")),
                            AvgReliability = reader.GetDecimal(reader.GetOrdinal("AvgReliability")),
                            AvgLevel = reader.GetDecimal(reader.GetOrdinal("AvgLevel"))
                        };
                    }
                }
            }
            return new UserReviewStats();
        }

    }
}
