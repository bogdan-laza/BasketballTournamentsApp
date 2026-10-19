namespace BasketballTournamentsApp.Jwt
{
    public class LoginRequest 
    { 
        public string Username { get; set; } 
        public string Password { get; set; } 
    }
    public class RefreshRequest 
    { 
        public string RefreshToken { get; set; } 
    }
    public class TokenResponse 
    { 
        public string AccessToken { get; set; } 
        public string RefreshToken { get; set; } 
    }

    public class VerifyEmailDTO
    {
        public string Email { get; set; }
        public string Code { get; set; }
    }

    public class ResendCodeDTO
    {
        public string Email { get; set; }
    }

}
