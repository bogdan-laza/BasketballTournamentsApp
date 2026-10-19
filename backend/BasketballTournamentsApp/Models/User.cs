using System.ComponentModel.DataAnnotations;

namespace BasketballTournamentsApp.Models
{
    public class User
    {
        public int UserId {  get; set; }

        [Required(ErrorMessage="Username is required!")]
        [StringLength(50, ErrorMessage = "Username cannot exceed 50 characters!")]
        public string Username {  get; set; }

        [Required(ErrorMessage = "First name is required!")]
        [StringLength(50, ErrorMessage = "First name cannot exceed 50 characters!")]
        public string FirstName {  get; set; }

        [Required(ErrorMessage = "Last name is required!")]
        [StringLength(50, ErrorMessage = "Last name cannot exceed 50 characters!")]
        public string LastName { get; set; }

        [Url(ErrorMessage = "The URL format is invalid!")]
        [StringLength(255, ErrorMessage = "The URL cannot exceed 255 characters!")]
        public string? ProfileImage { get; set; }

        [Required(ErrorMessage = "Player level is required!")]
        [Range(1, 3, ErrorMessage = "Player level must be between 1 and 3.")]
        public int PlayerLevel { get; set; }

        [StringLength(25, ErrorMessage = "Handedness cannot exceed 25 characters!")]
        [RegularExpression("Right|Left|Ambidextrous", ErrorMessage = "Handedness must be Right, Left, or Ambidextrous.")]
        public string Handedness { get; set; } = "Right";

        [Range(50, 250, ErrorMessage = "Height must be a valid number in centimeters (between 50 and 250).")]
        public int? Height { get; set; }

        [StringLength(50, ErrorMessage = "County cannot exceed 50 characters!")]
        public string? County { get; set; }

        [StringLength(50, ErrorMessage = "City cannot exceed 50 characters!")]
        public string? City { get; set; }

        [Required(ErrorMessage = "Date of birth is required!")]
        public DateTime DateOfBirth { get; set; }

        [Required(ErrorMessage = "Password is required!")]
        [StringLength(255, ErrorMessage = "Password cannot exceed 255 characters!")]
        public string PasswordHash { get; set; }

        [Required(ErrorMessage = "Email is required!")]
        [EmailAddress(ErrorMessage = "Invalid email format!")]
        [StringLength(150, ErrorMessage = "Email cannot exceed 150 characters!")]
        public string Email { get; set; }

        [Phone]
        [StringLength(10, ErrorMessage = "Invalid phone number!")]
        public string? PhoneNumber {  get; set; }

        [StringLength(500, ErrorMessage = "Refresh token cannot exceed 500 characters!")]
        public string RefreshToken { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required(ErrorMessage = "Role is required!")]
        [RegularExpression("Player|Admin|Referee",
           ErrorMessage = "Role must be one of: Player, Admin or Referee.")]
        public string PersonRole { get; set; } = "Player";

        public bool IsEmailVerified { get; set; } = false;

        public string? VerificationCode { get; set; }

        public DateTime? VerificationCodeExpires { get; set; }

        public DateTime? RefreshTokenExpiry { get; set; }
    }
}
