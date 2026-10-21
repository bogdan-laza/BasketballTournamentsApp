USE BasketballTournamentsApp
GO

DROP PROCEDURE IF EXISTS GET_TOURNAMENTS_PAGED_SORT_FILTER
DROP PROCEDURE IF EXISTS ADD_TOURNAMENT
DROP PROCEDURE IF EXISTS DELETE_TOURNAMENT
DROP PROCEDURE IF EXISTS UPDATE_TOURNAMENT
DROP PROCEDURE IF EXISTS CHECK_IF_TOURNAMENT_EXISTS_BY_ID
DROP PROCEDURE IF EXISTS GET_TOURNAMENT_BY_ID
GO
CREATE PROCEDURE GET_TOURNAMENTS_PAGED_SORT_FILTER
    @Page INT,
    @PageSize INT,
    @SortBy NVARCHAR(255),
    @SortOrder NVARCHAR(4),
    @TournamentName NVARCHAR(100)=NULL,
    @TournamentLocation NVARCHAR(150)=NULL,
    @TournamentMonth INT=NULL,
    @StartDate DATETIME=NULL,
    @EndDate DATETIME=NULL,
    @TournamentFormat NVARCHAR(50)=NULL,
    @CreatedByUserId INT=NULL,
    @Status NVARCHAR(20)=NULL,
    @TotalCount INT OUTPUT
AS
BEGIN

    SET NOCOUNT ON;

    SELECT @TotalCount=COUNT(*)
    FROM Tournament
    WHERE ((@TournamentName IS NULL OR TournamentName LIKE '%' + @TournamentName + '%') AND 
    (@TournamentLocation IS NULL OR TournamentLocation LIKE '%' + @TournamentLocation + '%') AND
    (@TournamentFormat IS NULL OR TournamentFormat LIKE '%' + @TournamentFormat + '%') AND
    (@CreatedByUserId IS NULL OR CreatedByUserId = @CreatedByUserId) AND
    (@Status IS NULL OR 
    (@Status='Cancelled' AND Status='Cancelled') OR
    (@Status='Upcoming' AND Status <> 'Cancelled' AND TournamentDate>GETUTCDATE()) OR
    (@Status='Ongoing' AND Status <> 'Cancelled' AND TournamentDate<=GETUTCDATE() AND GETUTCDATE() <= DATEADD(day, DaysDuration, TournamentDate)) OR
    (@Status='Completed' AND Status <> 'Cancelled' AND GETUTCDATE() > DATEADD(day, DaysDuration, TournamentDate))
    ) AND
    (@TournamentMonth IS NULL OR MONTH(TournamentDate)=@TournamentMonth) AND
    ((@StartDate IS NULL OR @StartDate<=TournamentDate) AND
    (@EndDate IS NULL OR @EndDate>=TournamentDate)))

    SELECT
        TournamentId,
        TournamentName,
        TournamentDate,
        DaysDuration,
        TournamentLocation,
        EntryFee,
        Prize,
        Rules,
        TournamentFormat,
        CreatedByUserId,
        MaximumNumberOfTeams,
        Status,
        RegistrationDeadline,
        TournamentImageUrl
    FROM Tournament
    WHERE ((@TournamentName IS NULL OR TournamentName LIKE '%' + @TournamentName + '%') AND 
    (@TournamentLocation IS NULL OR TournamentLocation LIKE '%' + @TournamentLocation + '%') AND
    (@TournamentFormat IS NULL OR TournamentFormat LIKE '%' + @TournamentFormat + '%') AND
    (@CreatedByUserId IS NULL OR CreatedByUserId = @CreatedByUserId) AND
   (@Status IS NULL OR 
    (@Status='Cancelled' AND Status='Cancelled') OR
    (@Status='Upcoming' AND Status <> 'Cancelled' AND TournamentDate>GETUTCDATE()) OR
    (@Status='Ongoing' AND Status <> 'Cancelled' AND TournamentDate<=GETUTCDATE() AND GETUTCDATE() <= DATEADD(day, DaysDuration, TournamentDate)) OR
    (@Status='Completed' AND Status <> 'Cancelled' AND GETUTCDATE() > DATEADD(day, DaysDuration, TournamentDate))
    ) AND
    (@TournamentMonth IS NULL OR MONTH(TournamentDate)=@TournamentMonth) AND
    ((@StartDate IS NULL OR @StartDate<=TournamentDate) AND
    (@EndDate IS NULL OR @EndDate>=TournamentDate)))
    ORDER BY
        CASE WHEN @SortBy='TournamentDate' AND @SortOrder='desc' THEN TournamentDate END DESC,
        CASE WHEN @SortBy='TournamentDate' AND @SortOrder='asc' THEN TournamentDate END ASC,
        CASE WHEN @SortBy='EntryFee' AND @SortOrder='asc' THEN EntryFee END ASC,
        CASE WHEN @SortBy='EntryFee' AND @SortOrder='desc' THEN EntryFee END DESC,
        CASE WHEN @SortBy='Prize' AND @SortOrder='desc' THEN Prize END DESC,
        CASE WHEN @SortBy='Prize' AND @SortOrder='asc' THEN Prize END ASC,
        TournamentId

    OFFSET (@Page-1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;

END
GO


CREATE PROCEDURE ADD_TOURNAMENT (
    @TournamentName NVARCHAR(100),
    @TournamentDate DATETIME,
    @DaysDuration INT,
	@TournamentLocation NVARCHAR(150),
	@EntryFee DECIMAL(10, 2),
	@Prize DECIMAL(10, 2),
	@Rules NVARCHAR(MAX) NULL,
	@TournamentFormat NVARCHAR(50),
	@CreatedByUserId INT,
	@MaximumNumberOfTeams INT,
	@Status NVARCHAR(20),
	@RegistrationDeadline DATETIME,
	@TournamentImageUrl NVARCHAR(255) NULL
)
AS
BEGIN

INSERT INTO Tournament (
    TournamentName,
    TournamentDate,
    DaysDuration,
    TournamentLocation,
    EntryFee,
    Prize,
    Rules,
    TournamentFormat,
    CreatedByUserId,
    MaximumNumberOfTeams,
    Status,
    RegistrationDeadline,
    TournamentImageUrl
)
VALUES (
    @TournamentName,
    @TournamentDate,
    @DaysDuration,
	@TournamentLocation,
	@EntryFee,
	@Prize,
	@Rules,
	@TournamentFormat,
	@CreatedByUserId,
	@MaximumNumberOfTeams,
	@Status,
	@RegistrationDeadline,
	@TournamentImageUrl
);

END
GO

CREATE PROCEDURE DELETE_TOURNAMENT(@TournamentId INT)
AS
BEGIN
    DELETE FROM Tournament WHERE TournamentId=@TournamentId
END

GO

CREATE PROCEDURE UPDATE_TOURNAMENT(
    @TournamentName NVARCHAR(100),
    @TournamentDate DATETIME,
    @DaysDuration INT,
	@TournamentLocation NVARCHAR(150),
	@EntryFee DECIMAL(10, 2),
	@Prize DECIMAL(10, 2),
	@Rules NVARCHAR(MAX) NULL,
	@TournamentFormat NVARCHAR(50),
	@CreatedByUserId INT,
	@MaximumNumberOfTeams INT,
	@Status NVARCHAR(20),
	@RegistrationDeadline DATETIME,
	@TournamentImageUrl NVARCHAR(255) NULL,
    @TournamentId INT
)
AS
BEGIN
    UPDATE Tournament 
    SET TournamentName=@TournamentName,
    TournamentDate=@TournamentDate,
    DaysDuration=@DaysDuration,
    TournamentLocation=@TournamentLocation,
    EntryFee=@EntryFee, 
    Prize=@Prize,
    Rules=@Rules,
    TournamentFormat=@TournamentFormat,
    CreatedByUserId=@CreatedByUserId,
    MaximumNumberOfTeams=@MaximumNumberOfTeams,
    Status=@Status,
    RegistrationDeadline=@RegistrationDeadline, 
    TournamentImageUrl=@TournamentImageUrl
    WHERE TournamentId=@TournamentId
END
GO

CREATE PROCEDURE CHECK_IF_TOURNAMENT_EXISTS_BY_ID
	@TournamentId INT
AS
BEGIN

SELECT COUNT(*) FROM Tournament WHERE TournamentId=@TournamentId

END
GO


CREATE PROCEDURE GET_TOURNAMENT_BY_ID
    @Id INT
AS
BEGIN
    SELECT
            TournamentId,
            TournamentName,
            TournamentDate,
            DaysDuration,
            TournamentLocation,
            EntryFee,
            Prize,
            Rules,
            TournamentFormat,
            CreatedByUserId,
            MaximumNumberOfTeams,
            Status,
            RegistrationDeadline,
            TournamentImageUrl
    FROM Tournament
    WHERE TournamentId = @Id;
END
GO