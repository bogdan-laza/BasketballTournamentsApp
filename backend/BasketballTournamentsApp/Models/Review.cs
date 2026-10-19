using System.ComponentModel.DataAnnotations;

namespace BasketballTournamentsApp.Models
{
    public class Review
    {
        public int ReviewerId { get; set; }

        public int ReviewedId { get; set; }

        public int TournamentId { get; set; }

        [DataType(DataType.DateTime)]
        public DateTime? ReviewDate { get; set; }

        [StringLength(255, ErrorMessage = "The review cannot exceed 255 characters!")]
        public string? ReviewText { get; set; }

        [Required(ErrorMessage = "Sportsmanship rating is required!")]
        [Range(1, 5, ErrorMessage = "The sportsmanhip rating must be between 1 and 5.")]
        public int SportsmanshipRating { get; set; }

        [Required(ErrorMessage = "Reliability rating is required!")]
        [Range(1, 5, ErrorMessage = "The reliability rating must be between 1 and 5.")]
        public int ReliabilityRating { get; set; }

        [Required(ErrorMessage = "ReviewedLevel is required!")]
        [Range(1, 3, ErrorMessage = "The level must be between 1 and 3.")]
        public int ReviewedLevel { get; set; }
    }
}
