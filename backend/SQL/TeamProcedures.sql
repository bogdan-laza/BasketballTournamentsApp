USE BasketballTournamentsApp
GO

DROP PROCEDURE IF EXISTS GET_TEAMS_PAGED_SORT_FILTER
DROP PROCEDURE IF EXISTS ADD_TEAM
DROP PROCEDURE IF EXISTS DELETE_TEAM
DROP PROCEDURE IF EXISTS UPDATE_TEAM
DROP PROCEDURE IF EXISTS CHECK_IF_TEAM_EXISTS_BY_ID
DROP PROCEDURE IF EXISTS GET_MY_TEAMS
GO

CREATE PROCEDURE GET_TEAMS_PAGED_SORT_FILTER
    @Page INT,
    @PageSize INT,
    @SortBy NVARCHAR(50),
    @SortOrder NVARCHAR(4),
    @TeamName NVARCHAR(100) = NULL,
    @CreatedByUserId INT=NULL,
    @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT @TotalCount = COUNT(*)
    FROM Team
    WHERE ((@TeamName IS NULL OR TeamName LIKE '%' + @TeamName + '%') AND (@CreatedByUserId IS NULL OR CreatedByUserId = @CreatedByUserId));

    SELECT 
        TeamId,
	    TeamName, 
	    CreatedByUserId,
	    CreatedAt,
	    LogoUrl
    FROM Team
    WHERE ((@TeamName IS NULL OR TeamName LIKE '%' + @TeamName + '%') AND (@CreatedByUserId IS NULL OR CreatedByUserId = @CreatedByUserId))
    ORDER BY 
        CASE WHEN @SortBy = 'CreatedAt' AND @SortOrder = 'desc' THEN CreatedAt END DESC,
        CASE WHEN @SortBy = 'CreatedAt' AND @SortOrder = 'asc' THEN CreatedAt END ASC,
        TeamId
    OFFSET (@Page - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO

EXEC GET_TEAMS;
GO

CREATE PROCEDURE ADD_TEAM
	@TeamName NVARCHAR(100),
	@CreatedByUserId INT,
	@CreatedAt DATETIME=NULL,
	@LogoUrl NVARCHAR(255)
AS
BEGIN

IF @CreatedAt IS NULL
        SET @CreatedAt = GETDATE();

INSERT INTO Team (
    TeamName,
	CreatedByUserId,
	CreatedAt,
	LogoUrl
)
VALUES (
    @TeamName,
	@CreatedByUserId,
	@CreatedAt,
	@LogoUrl
);

END
GO

CREATE PROCEDURE DELETE_TEAM(@TeamId INT)
AS
BEGIN
    DELETE FROM Team WHERE TeamId=@TeamId
END

GO

CREATE PROCEDURE UPDATE_TEAM
    @TeamName NVARCHAR(100),
	@CreatedByUserId INT,
	@CreatedAt DATETIME=NULL,
	@LogoUrl NVARCHAR(255),
    @TeamId INT
AS
BEGIN
    UPDATE Team
    SET 
	TeamName=@TeamName,
	CreatedByUserId=@CreatedByUserId,
	CreatedAt=@CreatedAt,
	LogoUrl=@LogoUrl
    WHERE TeamId=@TeamId
END
GO

CREATE PROCEDURE CHECK_IF_TEAM_EXISTS_BY_ID
	@TeamId INT
AS
BEGIN

SELECT COUNT(*) FROM Team WHERE TeamId=@TeamId

END
GO
CREATE PROCEDURE GET_MY_TEAMS
    @UserId INT,
    @Page INT,
    @PageSize INT,
    @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT @TotalCount = COUNT(DISTINCT t.TeamId)
    FROM Team t
    LEFT JOIN TeamMemberRegistration tmr ON t.TeamId = tmr.TeamId
    WHERE t.CreatedByUserId = @UserId OR tmr.UserId = @UserId;

    SELECT DISTINCT 
        t.TeamId, 
        t.TeamName, 
        t.CreatedByUserId,
        p.FirstName + ' ' + p.LastName AS CreatorName, 
        t.CreatedAt, 
        t.LogoUrl
    FROM Team t
    LEFT JOIN TeamMemberRegistration tmr ON t.TeamId = tmr.TeamId
    JOIN Person p ON t.CreatedByUserId = p.UserId -- Join to get the name
    WHERE t.CreatedByUserId = @UserId OR tmr.UserId = @UserId
    ORDER BY t.CreatedAt DESC
    OFFSET (@Page - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO
