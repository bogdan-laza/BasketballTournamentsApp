USE BasketballTournamentsApp
GO

DROP PROCEDURE IF EXISTS GET_PERSONS_PAGED_SORT_FILTER
DROP PROCEDURE IF EXISTS ADD_PERSON
DROP PROCEDURE IF EXISTS DELETE_PERSON
DROP PROCEDURE IF EXISTS UPDATE_PERSON
DROP PROCEDURE IF EXISTS CHECK_IF_PERSON_EXISTS_BY_ID
DROP PROCEDURE IF EXISTS CHECK_IF_PERSON_EXISTS_BY_USERNAME
DROP PROCEDURE IF EXISTS CHECK_IF_PERSON_EXISTS_BY_EMAIL
DROP PROCEDURE IF EXISTS UPDATE_PERSON_PASSWORD
DROP PROCEDURE IF EXISTS UPDATE_PERSON_PROFILE_IMAGE
DROP PROCEDURE IF EXISTS SET_REFRESH_TOKEN
DROP PROCEDURE IF EXISTS GET_PERSON_BY_USERNAME
DROP PROCEDURE IF EXISTS GET_PERSON_BY_EMAIL
DROP PROCEDURE IF EXISTS GET_PERSON_BY_ID
DROP PROCEDURE IF EXISTS GET_PERSONS_WITH_REFRESH_TOKEN
DROP PROCEDURE IF EXISTS VERIFY_PERSON_EMAIL
DROP PROCEDURE IF EXISTS SET_VERIFICATION_CODE
DROP PROCEDURE IF EXISTS GET_PERSONS
GO

CREATE PROCEDURE GET_PERSONS_PAGED_SORT_FILTER
    @Page INT,
    @PageSize INT,
    @SortBy NVARCHAR(255),
    @SortOrder NVARCHAR(4),
    @SearchTerm NVARCHAR(255) = NULL,
    @County NVARCHAR(100) = NULL,
    @City NVARCHAR(100) = NULL,
    @PersonRole NVARCHAR(50) = NULL,
    @PlayerLevel INT = NULL,
    @ExcludeUserId INT = NULL,
    @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT @TotalCount=COUNT(*)
    FROM Person
    WHERE 
        (@SearchTerm IS NULL OR 
            Username LIKE '%' + @SearchTerm + '%' OR 
            Email LIKE '%' + @SearchTerm + '%' OR 
            FirstName + ' ' + LastName LIKE '%' + @SearchTerm + '%' OR
            LastName + ' ' + FirstName LIKE '%' + @SearchTerm + '%'
        ) AND
        (@County IS NULL OR County = @County) AND
        (@City IS NULL OR City = @City) AND
        (@PersonRole IS NULL OR PersonRole LIKE '%' + @PersonRole + '%') AND
        (@PlayerLevel IS NULL OR PlayerLevel=@PlayerLevel) AND
        (@ExcludeUserId IS NULL OR UserId <> @ExcludeUserId)

    -- GET PAGED DATA
    SELECT  
        UserId,
        Username,
        FirstName,
        LastName,
        ProfileImage,
        PlayerLevel,
        Handedness,
        Height,
        County,
        City,
        DateOfBirth,
        PasswordHash,
        Email,
        PhoneNumber,
        RefreshToken,
        CreatedAt,
        PersonRole, 
        IsEmailVerified,
        VerificationCode,
        VerificationCodeExpires
    FROM Person
    WHERE 
        (@SearchTerm IS NULL OR 
            Username LIKE '%' + @SearchTerm + '%' OR 
            Email LIKE '%' + @SearchTerm + '%' OR 
            FirstName + ' ' + LastName LIKE '%' + @SearchTerm + '%' OR
            LastName + ' ' + FirstName LIKE '%' + @SearchTerm + '%'
        ) AND
        (@County IS NULL OR County = @County) AND
        (@City IS NULL OR City = @City) AND
        (@PersonRole IS NULL OR PersonRole LIKE '%' + @PersonRole + '%') AND
        (@PlayerLevel IS NULL OR PlayerLevel=@PlayerLevel) AND
        (@ExcludeUserId IS NULL OR UserId <> @ExcludeUserId)
    ORDER BY
        CASE WHEN @SortBy='CreatedAt' AND @SortOrder='desc' THEN CreatedAt END DESC,
        CASE WHEN @SortBy='CreatedAt' AND @SortOrder='asc' THEN CreatedAt END ASC,

        CASE WHEN @SortBy='Height' AND @SortOrder='desc' THEN Height END DESC,
        CASE WHEN @SortBy='Height' AND @SortOrder='asc' THEN Height END ASC,
        
        CASE WHEN @SortBy='DateOfBirth' AND @SortOrder='desc' THEN DateOfBirth END DESC,
        CASE WHEN @SortBy='DateOfBirth' AND @SortOrder='asc' THEN DateOfBirth END ASC,
        UserId

    OFFSET (@Page-1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;

END
GO

CREATE PROCEDURE ADD_PERSON 
	@Username NVARCHAR(50),
	@FirstName NVARCHAR(50),
	@LastName NVARCHAR(50),
	@ProfileImage NVARCHAR(255)=NULL,
	@PlayerLevel INT,
	@Handedness NVARCHAR(25)='Right',
    @Height INT=NULL,
    @County NVARCHAR(50)=NULL,
    @City NVARCHAR(50)=NULL,
    @DateOfBirth DATE='2004-09-12',
	@PasswordHash NVARCHAR(255),
	@Email NVARCHAR(150),
	@PhoneNumber NVARCHAR(10)=NULL,
	@RefreshToken NVARCHAR(500)=NULL,
	@CreatedAt DATETIME=NULL,
	@PersonRole NVARCHAR(50)='Player',	
	@IsEmailVerified BIT=0,
	@VerificationCode NVARCHAR(6)=NULL,
	@VerificationCodeExpires DATETIME2=NULL
AS
BEGIN

IF @CreatedAt IS NULL
        SET @CreatedAt = GETDATE();

INSERT INTO Person (
    Username,
	FirstName,
	LastName,
	ProfileImage,
	PlayerLevel,
	Handedness,
    Height,
    County,
    City,
    DateOfBirth,
	PasswordHash,
	Email,
	PhoneNumber,
	RefreshToken,
	CreatedAt,
	PersonRole,	
	IsEmailVerified,
	VerificationCode,
	VerificationCodeExpires
)
VALUES (
    @Username,
	@FirstName,
	@LastName,
	@ProfileImage,
	@PlayerLevel,
	@Handedness,
    @Height,
    @County,
    @City,
    @DateOfBirth,
	@PasswordHash,
	@Email,
	@PhoneNumber,
	@RefreshToken,
	@CreatedAt,
	@PersonRole,	
	@IsEmailVerified,
	@VerificationCode,
	@VerificationCodeExpires
);

END
GO

CREATE PROCEDURE DELETE_PERSON(@UserId INT)
AS
BEGIN
    DELETE FROM Person WHERE UserId=@UserId
END

GO

CREATE PROCEDURE UPDATE_PERSON
    @Username NVARCHAR(50),
	@FirstName NVARCHAR(50),
	@LastName NVARCHAR(50),
	@ProfileImage NVARCHAR(255)=NULL,
	@PlayerLevel INT,
	@Handedness NVARCHAR(25),
    @Height INT=NULL,
    @County NVARCHAR(50)=NULL,
    @City NVARCHAR(50)=NULL,
    @DateOfBirth DATE,
	@Email NVARCHAR(150),
	@PhoneNumber NVARCHAR(10)=NULL,
	@PersonRole NVARCHAR(50)='Player',	
    @UserId INT
AS
BEGIN

	 

    UPDATE Person
    SET 
	Username=@Username,
	FirstName=@FirstName,
	LastName=@LastName,
	ProfileImage=@ProfileImage,
	PlayerLevel=@PlayerLevel,
	Handedness=@Handedness,
    Height=@Height,
    County=@County,
    City=@City,
    DateOfBirth=@DateOfBirth,
	Email=@Email,
	PhoneNumber=@PhoneNumber,
	PersonRole=@PersonRole
    WHERE UserId=@UserId
END
GO

CREATE PROCEDURE UPDATE_PERSON_PASSWORD
	@UserId INT,
	@PasswordHash NVARCHAR(255)
AS
BEGIN

	UPDATE Person
	SET
	PasswordHash=@PasswordHash
	WHERE UserId=@UserId

END
GO

CREATE PROCEDURE UPDATE_PERSON_PROFILE_IMAGE
	@UserId INT,
	@ProfileImage NVARCHAR(255)
AS
BEGIN

	UPDATE Person
	SET
	ProfileImage=@ProfileImage
	WHERE UserId=@UserId

END
GO

CREATE PROCEDURE CHECK_IF_PERSON_EXISTS_BY_ID
	@Id INT
AS
BEGIN

SELECT COUNT(*) FROM Person WHERE UserId=@Id

END
GO

CREATE PROCEDURE CHECK_IF_PERSON_EXISTS_BY_USERNAME
	@Username NVARCHAR(50),
	@UserId INT
AS
BEGIN

SELECT COUNT(*) FROM Person WHERE Username=@Username AND UserId<>@UserId

END
GO

CREATE PROCEDURE CHECK_IF_PERSON_EXISTS_BY_EMAIL
	@Email NVARCHAR(150),
	@UserId INT
AS
BEGIN

SELECT COUNT(*) FROM Person WHERE Email=@Email AND UserId<>@UserId

END
GO

CREATE PROCEDURE SET_REFRESH_TOKEN
    @UserId INT,
    @RefreshToken NVARCHAR(500) = NULL,
    @RefreshTokenExpiry DATETIME = NULL
AS
BEGIN
    UPDATE Person
    SET RefreshToken = @RefreshToken,
        RefreshTokenExpiry = @RefreshTokenExpiry
    WHERE UserId = @UserId;
END
GO

CREATE PROCEDURE GET_PERSON_BY_USERNAME
    @Username NVARCHAR(50)
AS
BEGIN
    SELECT UserId, Username, FirstName, LastName, ProfileImage, PlayerLevel, Handedness, Height, County, City, DateOfBirth, PasswordHash, Email, PhoneNumber, RefreshToken, CreatedAt, PersonRole, IsEmailVerified, VerificationCode, VerificationCodeExpires, RefreshTokenExpiry
    FROM Person
    WHERE Username = @Username;
END
GO

CREATE PROCEDURE GET_PERSON_BY_EMAIL
    @Email NVARCHAR(50)
AS
BEGIN
    SELECT UserId, Username, FirstName, LastName, ProfileImage, PlayerLevel, Handedness, Height, County, City, DateOfBirth, PasswordHash, Email, PhoneNumber, RefreshToken, CreatedAt, PersonRole, IsEmailVerified, VerificationCode, VerificationCodeExpires, RefreshTokenExpiry
    FROM Person
    WHERE Email = @Email;
END
GO

CREATE PROCEDURE GET_PERSON_BY_ID
    @UserId INT
AS
BEGIN
    SELECT UserId, Username, FirstName, LastName, ProfileImage, PlayerLevel, Handedness, Height, County, City, DateOfBirth, PasswordHash, Email, PhoneNumber, RefreshToken, CreatedAt, PersonRole, IsEmailVerified, VerificationCode, VerificationCodeExpires, RefreshTokenExpiry
    FROM Person
    WHERE UserId = @UserId;
END
GO

CREATE PROCEDURE GET_PERSONS_WITH_REFRESH_TOKEN
AS
BEGIN
    SELECT UserId, Username, FirstName, LastName, ProfileImage, PlayerLevel, Handedness, Height, County, City, DateOfBirth, PasswordHash, Email, PhoneNumber, RefreshToken, CreatedAt, PersonRole, IsEmailVerified, VerificationCode, VerificationCodeExpires, RefreshTokenExpiry
    FROM Person
    WHERE RefreshToken IS NOT NULL;
END
GO

CREATE PROCEDURE VERIFY_PERSON_EMAIL
    @UserId INT
AS
BEGIN
    UPDATE Person
    SET IsEmailVerified = 1,
        VerificationCode = NULL,
        VerificationCodeExpires = NULL
    WHERE UserId = @UserId
END
GO

CREATE PROCEDURE SET_VERIFICATION_CODE
    @UserId INT,
    @VerificationCode NVARCHAR(6),
    @VerificationCodeExpires DATETIME2
AS
BEGIN
    UPDATE Person
    SET VerificationCode = @VerificationCode,
        VerificationCodeExpires = @VerificationCodeExpires
    WHERE UserId = @UserId
END
GO


select * from Person


