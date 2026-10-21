USE BasketballTournamentsApp
GO

DROP PROCEDURE IF EXISTS  GET_REVIEWS_PAGED_SORT_FILTER  
DROP PROCEDURE IF EXISTS  ADD_REVIEW  
DROP PROCEDURE IF EXISTS  DELETE_REVIEW
DROP PROCEDURE IF EXISTS  UPDATE_REVIEW  
DROP PROCEDURE IF EXISTS  GET_USER_REVIEW_STATS   
GO
 
 CREATE PROCEDURE GET_REVIEWS_PAGED_SORT_FILTER  
    @Page INT,  
    @PageSize INT,  
    @SortBy NVARCHAR(50),  
    @SortOrder NVARCHAR(10),  
    @ReviewedId INT=NULL,  
    @TotalCount INT OUTPUT  
AS  
BEGIN  
    SET NOCOUNT ON;  
  
    SELECT @TotalCount = COUNT(*)  
    FROM Review  
    WHERE (@ReviewedId IS NULL OR ReviewedId = @ReviewedId)  
  
    SELECT   
        ReviewerId,  
        ReviewedId,  
        TournamentId,  
        ReviewDate,   
        ReviewText,  
        SportsmanshipRating,  
        ReliabilityRating,  
        ReviewedLevel  
    FROM Review  
    WHERE (@ReviewedId IS NULL OR ReviewedId = @ReviewedId)  
    ORDER BY   
        CASE WHEN @SortBy = 'ReviewDate' AND @SortOrder = 'desc' THEN ReviewDate END DESC,  
        CASE WHEN @SortBy = 'ReviewDate' AND @SortOrder = 'asc' THEN ReviewDate END ASC,  
        CASE WHEN @SortBy = 'SportsmanshipRating' AND @SortOrder = 'desc' THEN SportsmanshipRating END DESC,  
        CASE WHEN @SortBy = 'SportsmanshipRating' AND @SortOrder = 'asc' THEN SportsmanshipRating END ASC,  
        CASE WHEN @SortBy = 'ReliabilityRating' AND @SortOrder = 'desc' THEN ReliabilityRating END DESC,  
        CASE WHEN @SortBy = 'ReliabilityRating' AND @SortOrder = 'asc' THEN ReliabilityRating END ASC,  
        ReviewerId, ReviewedId  
    OFFSET (@Page - 1) * @PageSize ROWS  
    FETCH NEXT @PageSize ROWS ONLY;  
END  
GO
 
 CREATE PROCEDURE ADD_REVIEW  
  @ReviewerId INT,  
     @ReviewedId INT,  
     @TournamentId INT,  
     @ReviewDate DATETIME=NULL,   
     @ReviewText NVARCHAR(255)=NULL,  
     @SportsmanshipRating INT,  
     @ReliabilityRating INT,  
     @ReviewedLevel INT  
AS  
BEGIN  
  
IF @ReviewDate IS NULL  
        SET @ReviewDate = GETDATE();  
  
INSERT INTO Review (  
    ReviewerId,  
    ReviewedId,  
    TournamentId,  
    ReviewDate,   
    ReviewText,  
    SportsmanshipRating,  
    ReliabilityRating,  
    ReviewedLevel  
)  
VALUES (  
   @ReviewerId,  
   @ReviewedId,  
   @TournamentId,  
   @ReviewDate,   
   @ReviewText,  
   @SportsmanshipRating,  
   @ReliabilityRating,  
   @ReviewedLevel  
);  
  
END  
GO
 
 CREATE PROCEDURE DELETE_REVIEW(@ReviewerId INT, @ReviewedId INT)  
AS  
BEGIN  
    DELETE FROM Review WHERE ReviewerId=@ReviewerId AND ReviewedId=@ReviewedId  
END  
GO
 
 CREATE PROCEDURE UPDATE_REVIEW  
     @ReviewerId INT,  
     @ReviewedId INT,  
     @TournamentId INT,  
     @ReviewDate DATETIME=NULL,   
     @ReviewText NVARCHAR(255)=NULL,  
     @SportsmanshipRating INT,  
     @ReliabilityRating INT,  
     @ReviewedLevel INT  
AS  
BEGIN  
    UPDATE Review  
    SET   
    TournamentId=@TournamentId,  
 ReviewDate=@ReviewDate,  
 ReviewText=@ReviewText,  
 SportsmanshipRating=@SportsmanshipRating,  
 ReliabilityRating=@ReliabilityRating,  
    ReviewedLevel=@ReviewedLevel  
    WHERE ReviewerId=@ReviewerId AND ReviewedId=@ReviewedId  
END  
GO
 
 CREATE PROCEDURE GET_USER_REVIEW_STATS  
    @UserId INT  
AS  
BEGIN  
    SELECT   
        COUNT(*) AS NumberOfReviews,  
        ISNULL(CAST(AVG(CAST(SportsmanshipRating AS DECIMAL(10,2))) AS DECIMAL(10,1)), 0) as AvgSportsmanship,  
        ISNULL(CAST(AVG(CAST(ReliabilityRating AS DECIMAL(10,2))) AS DECIMAL(10,1)), 0) as AvgReliability,  
        ISNULL(CAST(AVG(CAST(ReviewedLevel AS DECIMAL(10,2))) AS DECIMAL(10,1)), 0) as AvgLevel  
    FROM Review  
    WHERE ReviewedId = @UserId  
END  
