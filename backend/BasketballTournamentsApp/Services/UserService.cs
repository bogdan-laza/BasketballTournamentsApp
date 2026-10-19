using BasketballTournamentsApp.Extensions;
using BasketballTournamentsApp.Models;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;
using System.Data;
using BasketballTournamentsApp.Jwt;

namespace BasketballTournamentsApp.Services
{
    public class UserService
    {
        private readonly SqlConfig _config;
        private readonly IEmailService _emailService;

        public UserService(SqlConfig config, IEmailService emailService)
        {
            _config = config;
            _emailService = emailService;
        }

        public async Task<PagedResult<User>> GetPagedUsersAsync(
            int page, int pageSize, string sortBy, string sortOrder, string? searchTerm,
            string? county, string? city, string? personRole, int? playerLevel, int? excludeUserId)
        {
            if (page < 1)
                page = 1;
            const int maxPageSize = 100;
            if (pageSize < 1)
                pageSize = 10;
            if (pageSize > maxPageSize)
                pageSize = maxPageSize;

            var allowedSortBy = new[] { "CreatedAt", "DateOfBirth", "Height", "UserId" };
            if (!allowedSortBy.Contains(sortBy, StringComparer.OrdinalIgnoreCase))
                sortBy = "CreatedAt";

            if (sortOrder != "desc" && sortOrder != "asc")
                sortOrder = "desc";

            var items = new List<User>();
            int totalCount = 0;

            using (var conn = new SqlConnection(_config.ConnectionString))
            using (var cmd = new SqlCommand("GET_PERSONS_PAGED_SORT_FILTER", conn))
            {
                cmd.CommandType = System.Data.CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Page", page);
                cmd.Parameters.AddWithValue("@PageSize", pageSize);
                cmd.Parameters.AddWithValue("@SortBy", sortBy);
                cmd.Parameters.AddWithValue("@SortOrder", sortOrder);
                cmd.Parameters.AddWithValue("@SearchTerm", (object?)searchTerm ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@County", (object?)county ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@City", (object?)city ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@PersonRole", (object?)personRole ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@PlayerLevel", (object?)playerLevel ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ExcludeUserId", (object?)excludeUserId ?? DBNull.Value);

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
                        items.Add(new User
                        {
                            UserId = reader.GetInt32(reader.GetOrdinal("UserId")),
                            Username = reader.GetString(reader.GetOrdinal("Username")),
                            FirstName = reader.GetString(reader.GetOrdinal("FirstName")),
                            LastName = reader.GetString(reader.GetOrdinal("LastName")),
                            ProfileImage = reader.IsDBNull(reader.GetOrdinal("ProfileImage")) ? null : reader.GetString(reader.GetOrdinal("ProfileImage")),
                            PlayerLevel = reader.GetInt32(reader.GetOrdinal("PlayerLevel")),
                            Handedness = reader.GetString(reader.GetOrdinal("Handedness")),
                            Height = reader.IsDBNull(reader.GetOrdinal("Height")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("Height")),
                            County = reader.IsDBNull(reader.GetOrdinal("County")) ? null : reader.GetString(reader.GetOrdinal("County")),
                            City = reader.IsDBNull(reader.GetOrdinal("City")) ? null : reader.GetString(reader.GetOrdinal("City")),
                            DateOfBirth = reader.GetDateTime(reader.GetOrdinal("DateOfBirth")),
                            PasswordHash = reader.GetString(reader.GetOrdinal("PasswordHash")),
                            Email = reader.GetString(reader.GetOrdinal("Email")),
                            PhoneNumber = reader.IsDBNull(reader.GetOrdinal("PhoneNumber")) ? null : reader.GetString(reader.GetOrdinal("PhoneNumber")),
                            CreatedAt = reader.GetDateTime(reader.GetOrdinal("CreatedAt")),
                            PersonRole = reader.GetString(reader.GetOrdinal("PersonRole")),
                            IsEmailVerified = reader.GetBoolean(reader.GetOrdinal("IsEmailVerified")),
                            VerificationCode=reader.IsDBNull(reader.GetOrdinal("VerificationCode")) ? null : reader.GetString(reader.GetOrdinal("VerificationCode")),
                            VerificationCodeExpires=reader.IsDBNull(reader.GetOrdinal("VerificationCodeExpires")) ? null : reader.GetDateTime(reader.GetOrdinal("VerificationCodeExpires"))
                        });
                    }
                }
                totalCount = (int)(outParam.Value ?? 0);
            }

            return new PagedResult<User>
            {
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                Items = items
            };
        }

        public async Task AddUserAsync(User user)
        {
            if (await CheckIfUserExistsByUsernameAsync(user.Username, -1))
                throw new ArgumentException("This username is already taken.");

            if (await CheckIfUserExistsByEmailAsync(user.Email, -1))
                throw new ArgumentException("This email is already registered.");

            if (!string.IsNullOrEmpty(user.PhoneNumber) && user.PhoneNumber.Length != 10)
                throw new ArgumentException("Invalid phone number.");


            if (user.PasswordHash.Length<8)
                throw new ArgumentException("Password must be at least 8 character long.");

            int digitCount = user.PasswordHash.Count(char.IsDigit);
            bool hasSpecialChar = user.PasswordHash.Any(ch => !char.IsLetterOrDigit(ch));

            if (digitCount < 2)
                throw new ArgumentException("Password must contain at least two digits.");

            if (!hasSpecialChar)
                throw new ArgumentException("Password must contain at least one special character.");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.PasswordHash);

            user.VerificationCode = new Random().Next(100000, 999999).ToString();
            user.VerificationCodeExpires = DateTime.UtcNow.AddMinutes(15);
            user.IsEmailVerified = false;

            using (var conn = new SqlConnection(_config.ConnectionString))
            using (var cmd = new SqlCommand("ADD_PERSON", conn))
            {
                cmd.CommandType = System.Data.CommandType.StoredProcedure;
                await conn.OpenAsync();
                cmd.Parameters.AddWithValue("@UserName", user.Username);
                cmd.Parameters.AddWithValue("@FirstName", user.FirstName);
                cmd.Parameters.AddWithValue("@LastName", user.LastName);
                cmd.Parameters.AddWithValue("@ProfileImage", (object?)user.ProfileImage ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@PlayerLevel", user.PlayerLevel);
                cmd.Parameters.AddWithValue("@Handedness", user.Handedness);
                cmd.Parameters.AddWithValue("@Height", (object?)user.Height ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@County", (object?)user.County ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@City", (object?)user.City ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@DateOfBirth", user.DateOfBirth);
                cmd.Parameters.AddWithValue("@PasswordHash", user.PasswordHash);
                cmd.Parameters.AddWithValue("@Email", user.Email);
                cmd.Parameters.AddWithValue("@PhoneNumber", (object?)user.PhoneNumber ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@RefreshToken", (object?)user.RefreshToken ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@CreatedAt", user.CreatedAt);
                cmd.Parameters.AddWithValue("@PersonRole", user.PersonRole);
                cmd.Parameters.AddWithValue("@IsEmailVerified", user.IsEmailVerified);
                cmd.Parameters.AddWithValue("@VerificationCode", (object?)user.VerificationCode ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@VerificationCodeExpires", (object?)user.VerificationCodeExpires ?? DBNull.Value);

                await cmd.ExecuteNonQueryAsync();

                string emailBody = $@"
        <div style='font-family: Arial, sans-serif; text-align: center; color: #333;'>
            <h2>Welcome to HoopZone! 🏀</h2>
            <p>We are thrilled to have you. Please verify your email address to complete your registration.</p>
            <h1 style='color: #f97316; font-size: 36px; letter-spacing: 5px;'>{user.VerificationCode}</h1>
            <p>This code will expire in 15 minutes.</p>
        </div>";

                await _emailService.SendEmailAsync(user.Email, "Verify Your HoopZone Account", emailBody);
            }
        }

        public async Task DeleteUserAsync(int userId)
        {
            using (var conn = new SqlConnection(_config.ConnectionString))
            using (var cmd = new SqlCommand("DELETE_PERSON", conn))
            {
                cmd.CommandType = System.Data.CommandType.StoredProcedure;
                await conn.OpenAsync();
                cmd.Parameters.AddWithValue("@UserId", userId);
                var rowsAffected = await cmd.ExecuteNonQueryAsync();
                if (rowsAffected == 0)
                {
                    throw new ArgumentException($"User with ID {userId} does not exist.");
                }
            }
        }

        public async Task UpdateUserAsync(User user)
        {
            if (await CheckIfUserExistsByUsernameAsync(user.Username, user.UserId))
                throw new ArgumentException("This username is already taken.");

            if (await CheckIfUserExistsByEmailAsync(user.Email, user.UserId))
                throw new ArgumentException("This email is already registered.");

            if (!string.IsNullOrEmpty(user.PhoneNumber) && user.PhoneNumber.Length != 10)
                throw new ArgumentException("Invalid phone number.");

            using (var conn = new SqlConnection(_config.ConnectionString))
            using (var cmd = new SqlCommand("UPDATE_PERSON", conn))
            {
                cmd.CommandType = System.Data.CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@UserId", user.UserId);
                cmd.Parameters.AddWithValue("@Username", user.Username);
                cmd.Parameters.AddWithValue("@FirstName", user.FirstName);
                cmd.Parameters.AddWithValue("@LastName", user.LastName);
                cmd.Parameters.AddWithValue("@ProfileImage", (object?)user.ProfileImage ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@PlayerLevel", user.PlayerLevel);
                cmd.Parameters.AddWithValue("@Handedness", user.Handedness);
                cmd.Parameters.AddWithValue("@Height", (object?)user.Height ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@County", (object?)user.County ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@City", (object?)user.City ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@DateOfBirth", user.DateOfBirth);
                cmd.Parameters.AddWithValue("@Email", user.Email);
                cmd.Parameters.AddWithValue("@PhoneNumber", (object?)user.PhoneNumber ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@PersonRole", user.PersonRole);

                await conn.OpenAsync();
                var rowsAffected = await cmd.ExecuteNonQueryAsync();
                if (rowsAffected == 0)
                {
                    throw new ArgumentException($"User with ID {user.UserId} does not exist.");
                }
            }

        }

        public async Task UpdatePasswordAsync(int userId, string oldPassword, string newPassword)
        {
            if (string.IsNullOrWhiteSpace(newPassword) || newPassword.Length < 8)
                throw new ArgumentException("Password must be at least 8 characters long.");

            int digitCount = newPassword.Count(char.IsDigit);
            bool hasSpecialChar = newPassword.Any(ch => !char.IsLetterOrDigit(ch));

            if (digitCount < 2)
                throw new ArgumentException("Password must contain at least two digits.");
            if (!hasSpecialChar)
                throw new ArgumentException("Password must contain at least one special character.");

            string hashedOldPassword = BCrypt.Net.BCrypt.HashPassword(oldPassword);
            User user = await GetUserByIdAsync(userId);
            if (user == null)
                throw new ArgumentException($"User with ID {userId} does not exist.");

            if (!BCrypt.Net.BCrypt.Verify(oldPassword, user.PasswordHash))
                throw new ArgumentException("The old password is incorrect.");

            string hashedNewPassword = BCrypt.Net.BCrypt.HashPassword(newPassword);

            using (var conn = new SqlConnection(_config.ConnectionString))
            using (var cmd = new SqlCommand("UPDATE_PERSON_PASSWORD", conn))
            {
                cmd.CommandType = System.Data.CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@UserId", userId);
                cmd.Parameters.AddWithValue("@PasswordHash", hashedNewPassword);

                await conn.OpenAsync();
                var rowsAffected = await cmd.ExecuteNonQueryAsync();
                if (rowsAffected == 0)
                    throw new ArgumentException($"User with ID {userId} does not exist.");
            }
        }

        public async Task UpdateProfileImageAsync(int userId, string newProfileImage)
        {
            if (!string.IsNullOrEmpty(newProfileImage) && newProfileImage.Length > 255)
            {
                throw new ArgumentException("The URL cannot exceed 255 characters!");
            }

            if (!string.IsNullOrEmpty(newProfileImage))
            {
                bool isValidUrl = Uri.TryCreate(newProfileImage, UriKind.Absolute, out Uri? uriResult)
                                  && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps);

                if (!isValidUrl)
                {
                    throw new ArgumentException("The URL format is invalid!");
                }
            }

            using (var conn = new SqlConnection(_config.ConnectionString))
            using (var cmd = new SqlCommand("UPDATE_PERSON_PROFILE_IMAGE", conn))
            {
                cmd.CommandType = System.Data.CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@UserId", userId);
                cmd.Parameters.AddWithValue("@ProfileImage", (object?)newProfileImage ?? DBNull.Value);

                await conn.OpenAsync();
                var rowsAffected = await cmd.ExecuteNonQueryAsync();
                if (rowsAffected == 0)
                    throw new ArgumentException($"User with ID {userId} does not exist.");
            }
        }

        public async Task<bool> CheckIfUserExistsByIdAsync(int id)
        {
            using(var conn=new SqlConnection(_config.ConnectionString))
            using (var cmd = new SqlCommand("CHECK_IF_PERSON_EXISTS_BY_ID", conn))
            {
                cmd.CommandType=System.Data.CommandType.StoredProcedure;
                await conn.OpenAsync();
                cmd.Parameters.AddWithValue("@Id", id);
                int count=(int)cmd.ExecuteScalar();
                return count > 0;
            }
        }

        public async Task<bool> CheckIfUserExistsByUsernameAsync(string username, int id)
        {
            using (var conn = new SqlConnection(_config.ConnectionString))
            using (var cmd = new SqlCommand("CHECK_IF_PERSON_EXISTS_BY_USERNAME", conn))
            {
                cmd.CommandType = System.Data.CommandType.StoredProcedure;
                await conn.OpenAsync();
                cmd.Parameters.AddWithValue("@Username", username);
                cmd.Parameters.AddWithValue("UserId", id);
                int count = (int)(await cmd.ExecuteScalarAsync());
                return count > 0;
            }
        }

        public async Task<bool> CheckIfUserExistsByEmailAsync(string email, int id)
        {
            using (var conn = new SqlConnection(_config.ConnectionString))
            using (var cmd = new SqlCommand("CHECK_IF_PERSON_EXISTS_BY_EMAIL", conn))
            {
                cmd.CommandType = System.Data.CommandType.StoredProcedure;
                await conn.OpenAsync();
                cmd.Parameters.AddWithValue("@Email", email);
                cmd.Parameters.AddWithValue("UserId", id);
                int count = (int)(await cmd.ExecuteScalarAsync());
                return count > 0;
            }
        }

        public async Task<User?> GetUserByUsernameAsync(string username)
        {
            using var conn = new SqlConnection(_config.ConnectionString);
            using var cmd = new SqlCommand("GET_PERSON_BY_USERNAME", conn) 
            { 
                CommandType = CommandType.StoredProcedure 
            };
            cmd.Parameters.AddWithValue("@Username", username);
            await conn.OpenAsync();
            using var reader = await cmd.ExecuteReaderAsync();
            if (!await reader.ReadAsync()) return null;

            return new User
            {
                UserId = reader.GetInt32(reader.GetOrdinal("UserId")),
                Username = reader.GetString(reader.GetOrdinal("Username")),
                FirstName = reader.GetString(reader.GetOrdinal("FirstName")),
                LastName = reader.GetString(reader.GetOrdinal("LastName")),
                ProfileImage = reader.IsDBNull(reader.GetOrdinal("ProfileImage")) ? null : reader.GetString(reader.GetOrdinal("ProfileImage")),
                PlayerLevel = reader.GetInt32(reader.GetOrdinal("PlayerLevel")),
                Handedness = reader.GetString(reader.GetOrdinal("Handedness")),
                Height = reader.IsDBNull(reader.GetOrdinal("Height")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("Height")),
                County = reader.IsDBNull(reader.GetOrdinal("County")) ? null : reader.GetString(reader.GetOrdinal("County")),
                City = reader.IsDBNull(reader.GetOrdinal("City")) ? null : reader.GetString(reader.GetOrdinal("City")),
                DateOfBirth = reader.GetDateTime(reader.GetOrdinal("DateOfBirth")),
                Email = reader.GetString(reader.GetOrdinal("Email")),
                PhoneNumber = reader.IsDBNull(reader.GetOrdinal("PhoneNumber")) ? null : reader.GetString(reader.GetOrdinal("PhoneNumber")),
                CreatedAt = reader.GetDateTime(reader.GetOrdinal("CreatedAt")),
                IsEmailVerified = reader.GetBoolean(reader.GetOrdinal("IsEmailVerified")),
                PasswordHash = reader.GetString(reader.GetOrdinal("PasswordHash")),
                PersonRole = reader.GetString(reader.GetOrdinal("PersonRole")),
                RefreshToken = reader.IsDBNull(reader.GetOrdinal("RefreshToken")) ? null : reader.GetString(reader.GetOrdinal("RefreshToken")),
                RefreshTokenExpiry = reader.IsDBNull(reader.GetOrdinal("RefreshTokenExpiry")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("RefreshTokenExpiry")),
                VerificationCode = reader.IsDBNull(reader.GetOrdinal("VerificationCode")) ? null : reader.GetString(reader.GetOrdinal("VerificationCode")),
                VerificationCodeExpires = reader.IsDBNull(reader.GetOrdinal("VerificationCodeExpires")) ? null : reader.GetDateTime(reader.GetOrdinal("VerificationCodeExpires"))
            };
        }

        public async Task<User?> GetUserByIdAsync(int id)
        {
            using var conn = new SqlConnection(_config.ConnectionString);
            using var cmd = new SqlCommand("GET_PERSON_BY_ID", conn)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@UserId", id);
            await conn.OpenAsync();
            using var reader = await cmd.ExecuteReaderAsync();
            if (!await reader.ReadAsync()) return null;

            return new User
            {
                UserId = reader.GetInt32(reader.GetOrdinal("UserId")),
                Username = reader.GetString(reader.GetOrdinal("Username")),
                FirstName = reader.GetString(reader.GetOrdinal("FirstName")),
                LastName = reader.GetString(reader.GetOrdinal("LastName")),
                ProfileImage = reader.IsDBNull(reader.GetOrdinal("ProfileImage")) ? null : reader.GetString(reader.GetOrdinal("ProfileImage")),
                PlayerLevel = reader.GetInt32(reader.GetOrdinal("PlayerLevel")),
                Handedness = reader.GetString(reader.GetOrdinal("Handedness")),
                Height = reader.IsDBNull(reader.GetOrdinal("Height")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("Height")),
                County = reader.IsDBNull(reader.GetOrdinal("County")) ? null : reader.GetString(reader.GetOrdinal("County")),
                City = reader.IsDBNull(reader.GetOrdinal("City")) ? null : reader.GetString(reader.GetOrdinal("City")),
                DateOfBirth = reader.GetDateTime(reader.GetOrdinal("DateOfBirth")),
                Email = reader.GetString(reader.GetOrdinal("Email")),
                PhoneNumber = reader.IsDBNull(reader.GetOrdinal("PhoneNumber")) ? null : reader.GetString(reader.GetOrdinal("PhoneNumber")),
                CreatedAt = reader.GetDateTime(reader.GetOrdinal("CreatedAt")),
                IsEmailVerified = reader.GetBoolean(reader.GetOrdinal("IsEmailVerified")),
                PasswordHash = reader.GetString(reader.GetOrdinal("PasswordHash")),
                PersonRole = reader.GetString(reader.GetOrdinal("PersonRole")),
                RefreshToken = reader.IsDBNull(reader.GetOrdinal("RefreshToken")) ? null : reader.GetString(reader.GetOrdinal("RefreshToken")),
                RefreshTokenExpiry = reader.IsDBNull(reader.GetOrdinal("RefreshTokenExpiry")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("RefreshTokenExpiry")),
                VerificationCode = reader.IsDBNull(reader.GetOrdinal("VerificationCode")) ? null : reader.GetString(reader.GetOrdinal("VerificationCode")),
                VerificationCodeExpires = reader.IsDBNull(reader.GetOrdinal("VerificationCodeExpires")) ? null : reader.GetDateTime(reader.GetOrdinal("VerificationCodeExpires"))
            };
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            using var conn = new SqlConnection(_config.ConnectionString);
            using var cmd = new SqlCommand("GET_PERSON_BY_EMAIL", conn)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@Email", email);
            await conn.OpenAsync();
            using var reader = await cmd.ExecuteReaderAsync();
            if (!await reader.ReadAsync()) return null;

            return new User
            {
                UserId = reader.GetInt32(reader.GetOrdinal("UserId")),
                Username = reader.GetString(reader.GetOrdinal("Username")),
                FirstName = reader.GetString(reader.GetOrdinal("FirstName")),
                LastName = reader.GetString(reader.GetOrdinal("LastName")),
                ProfileImage = reader.IsDBNull(reader.GetOrdinal("ProfileImage")) ? null : reader.GetString(reader.GetOrdinal("ProfileImage")),
                PlayerLevel = reader.GetInt32(reader.GetOrdinal("PlayerLevel")),
                Handedness = reader.GetString(reader.GetOrdinal("Handedness")),
                Height = reader.IsDBNull(reader.GetOrdinal("Height")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("Height")),
                County = reader.IsDBNull(reader.GetOrdinal("County")) ? null : reader.GetString(reader.GetOrdinal("County")),
                City = reader.IsDBNull(reader.GetOrdinal("City")) ? null : reader.GetString(reader.GetOrdinal("City")),
                DateOfBirth = reader.GetDateTime(reader.GetOrdinal("DateOfBirth")),
                Email = reader.GetString(reader.GetOrdinal("Email")),
                PhoneNumber = reader.IsDBNull(reader.GetOrdinal("PhoneNumber")) ? null : reader.GetString(reader.GetOrdinal("PhoneNumber")),
                CreatedAt = reader.GetDateTime(reader.GetOrdinal("CreatedAt")),
                IsEmailVerified = reader.GetBoolean(reader.GetOrdinal("IsEmailVerified")),
                PasswordHash = reader.GetString(reader.GetOrdinal("PasswordHash")),
                PersonRole = reader.GetString(reader.GetOrdinal("PersonRole")),
                RefreshToken = reader.IsDBNull(reader.GetOrdinal("RefreshToken")) ? null : reader.GetString(reader.GetOrdinal("RefreshToken")),
                RefreshTokenExpiry = reader.IsDBNull(reader.GetOrdinal("RefreshTokenExpiry")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("RefreshTokenExpiry")),
                VerificationCode = reader.IsDBNull(reader.GetOrdinal("VerificationCode")) ? null : reader.GetString(reader.GetOrdinal("VerificationCode")),
                VerificationCodeExpires = reader.IsDBNull(reader.GetOrdinal("VerificationCodeExpires")) ? null : reader.GetDateTime(reader.GetOrdinal("VerificationCodeExpires"))
            };
        }

        public async Task SetRefreshTokenAsync(int userId, string? hashedRefreshToken, DateTime? expiry)
        {
            using var conn = new SqlConnection(_config.ConnectionString);
            using var cmd = new SqlCommand("SET_REFRESH_TOKEN", conn) { CommandType = CommandType.StoredProcedure };
            Console.WriteLine(userId);
            Console.WriteLine(hashedRefreshToken);
            cmd.Parameters.AddWithValue("@UserId", userId);
            cmd.Parameters.AddWithValue("@RefreshToken", (object?)hashedRefreshToken ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@RefreshTokenExpiry", (object?)expiry ?? DBNull.Value);
            await conn.OpenAsync();
            await cmd.ExecuteNonQueryAsync();
        }

        public async Task<User?> GetByRefreshTokenAsync(string refreshTokenPlain, TokenService tokenService)
        {
            using var conn = new SqlConnection(_config.ConnectionString);
            using var cmd = new SqlCommand("GET_PERSONS_WITH_REFRESH_TOKEN", conn) { CommandType = CommandType.StoredProcedure };
            // This sp returns users where RefreshToken IS NOT NULL (or you can return all users and compare)
            await conn.OpenAsync();
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var hashed = reader.IsDBNull(reader.GetOrdinal("RefreshToken")) ? null : reader.GetString(reader.GetOrdinal("RefreshToken"));
                if (hashed != null && tokenService.VerifyRefreshToken(refreshTokenPlain, hashed))
                {
                    return new User
                    {
                        UserId = reader.GetInt32(reader.GetOrdinal("UserId")),
                        Username = reader.GetString(reader.GetOrdinal("Username")),
                        FirstName = reader.GetString(reader.GetOrdinal("FirstName")),
                        LastName = reader.GetString(reader.GetOrdinal("LastName")),
                        ProfileImage = reader.IsDBNull(reader.GetOrdinal("ProfileImage")) ? null : reader.GetString(reader.GetOrdinal("ProfileImage")),
                        PlayerLevel = reader.GetInt32(reader.GetOrdinal("PlayerLevel")),
                        Handedness = reader.GetString(reader.GetOrdinal("Handedness")),
                        Height = reader.IsDBNull(reader.GetOrdinal("Height")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("Height")),
                        County = reader.IsDBNull(reader.GetOrdinal("County")) ? null : reader.GetString(reader.GetOrdinal("County")),
                        City = reader.IsDBNull(reader.GetOrdinal("City")) ? null : reader.GetString(reader.GetOrdinal("City")),
                        DateOfBirth = reader.GetDateTime(reader.GetOrdinal("DateOfBirth")),
                        Email = reader.GetString(reader.GetOrdinal("Email")),
                        PhoneNumber = reader.IsDBNull(reader.GetOrdinal("PhoneNumber")) ? null : reader.GetString(reader.GetOrdinal("PhoneNumber")),
                        CreatedAt = reader.GetDateTime(reader.GetOrdinal("CreatedAt")),
                        IsEmailVerified = reader.GetBoolean(reader.GetOrdinal("IsEmailVerified")),
                        PasswordHash = reader.GetString(reader.GetOrdinal("PasswordHash")),
                        PersonRole = reader.GetString(reader.GetOrdinal("PersonRole")),
                        RefreshToken = reader.IsDBNull(reader.GetOrdinal("RefreshToken")) ? null : reader.GetString(reader.GetOrdinal("RefreshToken")),
                        RefreshTokenExpiry = reader.IsDBNull(reader.GetOrdinal("RefreshTokenExpiry")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("RefreshTokenExpiry")),
                        VerificationCode = reader.IsDBNull(reader.GetOrdinal("VerificationCode")) ? null : reader.GetString(reader.GetOrdinal("VerificationCode")),
                        VerificationCodeExpires = reader.IsDBNull(reader.GetOrdinal("VerificationCodeExpires")) ? null : reader.GetDateTime(reader.GetOrdinal("VerificationCodeExpires"))
                    };
                }
            }
            return null;
        }

        public async Task VerifyUserEmailAsync(int userId)
        {
            using var conn = new SqlConnection(_config.ConnectionString);
            using var cmd = new SqlCommand("VERIFY_PERSON_EMAIL", conn)
            {
                CommandType = CommandType.StoredProcedure
            };

            cmd.Parameters.AddWithValue("@UserId", userId);

            await conn.OpenAsync();
            await cmd.ExecuteNonQueryAsync();
        }

        public async Task SetVerificationCodeAsync(int userId, string verificationCode, DateTime expires)
        {
            using var conn = new SqlConnection(_config.ConnectionString);
            using var cmd = new SqlCommand("SET_VERIFICATION_CODE", conn)
            {
                CommandType = CommandType.StoredProcedure
            };

            cmd.Parameters.AddWithValue("@UserId", userId);
            cmd.Parameters.AddWithValue("@VerificationCode", verificationCode);
            cmd.Parameters.AddWithValue("@VerificationCodeExpires", expires);

            await conn.OpenAsync();
            await cmd.ExecuteNonQueryAsync();
        }

    }
}
