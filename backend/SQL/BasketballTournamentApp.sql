USE BasketballTournamentsApp
DROP TABLE IF EXISTS Game;
DROP TABLE IF EXISTS TeamRegistration;
DROP TABLE IF EXISTS TeamMemberRegistration; 
DROP TABLE IF EXISTS Team;
DROP TABLE IF EXISTS Tournament;
DROP TABLE IF EXISTS Person;
DROP TABLE IF EXISTS Review;
GO

CREATE TABLE Person(
	UserId INT IDENTITY(1, 1) PRIMARY KEY,
	Username NVARCHAR(50) UNIQUE, 
	FirstName NVARCHAR(50),
	LastName NVARCHAR(50),
	ProfileImage NVARCHAR(255) NULL,
	PlayerLevel INT CHECK (PlayerLevel BETWEEN 1 AND 3),
	Handedness NVARCHAR(25) NOT NULL DEFAULT 'Right' CHECK (Handedness IN ('Right', 'Left', 'Ambidextrous')),
	Height INT NULL,
	County NVARCHAR(50) NULL,
	City NVARCHAR(50) NULL,
	DateOfBirth DATE NOT NULL DEFAULT '2004-09-12',
	PasswordHash NVARCHAR(255),
	Email NVARCHAR(150) UNIQUE,
	PhoneNumber NVARCHAR(10) NULL,
	RefreshToken VARCHAR(60) NULL,
	CreatedAt DATETIME DEFAULT GETDATE(), 
	PersonRole NVARCHAR(50) DEFAULT 'Player',
	IsEmailVerified BIT DEFAULT 0,
	VerificationCode NVARCHAR(6) NULL,
	VerificationCodeExpires DATETIME2 NULL,
	RefreshTokenExpiry DATETIME NULL
);
GO

ALTER TABLE Person
ADD Handedness NVARCHAR(25) NOT NULL DEFAULT 'Right' CHECK (Handedness IN ('Right', 'Left', 'Ambidextrous'))

ALTER TABLE Person
ADD Height INT NULL

ALTER TABLE Person
ADD County NVARCHAR(50) NULL

ALTER TABLE Person
ADD City NVARCHAR(50) NULL

ALTER TABLE Person
ADD DateOfBirth DATE NOT NULL DEFAULT '2004-09-12'

ALTER TABLE Person
ADD ProfileImage NVARCHAR(255) NULL

ALTER TABLE Person
ADD PlayerLevel INT NOT NULL DEFAULT 2 CHECK (PlayerLevel BETWEEN 1 AND 3)

CREATE TABLE Tournament(
	TournamentId INT IDENTITY (1, 1) PRIMARY KEY,
	TournamentName NVARCHAR(100), 
	TournamentDate DATETIME, 
	TournamentLocation NVARCHAR(150), 
	EntryFee DECIMAL(10, 2), 
	Prize DECIMAL(10, 2), 
	Rules NVARCHAR(MAX) NULL,
	TournamentFormat NVARCHAR(50), 
	CreatedByUserId INT,
	MaximumNumberOfTeams INT CHECK (MaximumNumberOfTeams>=2),
	FOREIGN KEY (CreatedByUserId) REFERENCES Person(UserId),
	Status NVARCHAR(20) CHECK (Status IN ('Upcoming', 'Ongoing', 'Completed', 'Cancelled')), 
	RegistrationDeadline DATETIME,
	TournamentImageUrl NVARCHAR(255) NULL
);
GO

ALTER TABLE Tournament
ADD DaysDuration INT NOT NULL DEFAULT 1;
GO

CREATE TABLE Team(
	TeamId INT IDENTITY (1, 1) PRIMARY KEY,
	TeamName NVARCHAR(100) UNIQUE,
	CreatedByUserId INT,
	CreatedAt DATETIME DEFAULT GETDATE(),
	FOREIGN KEY (CreatedByUserId) REFERENCES Person(UserId),
	LogoUrl NVARCHAR(255) NULL
);
GO

CREATE TABLE Review(
	ReviewerId INT,
	ReviewedId INT,
	TournamentId INT,
	ReviewDate DATETIME DEFAULT GETDATE(),
	ReviewText NVARCHAR(255) NULL,
	SportsmanshipRating INT CHECK (SportsmanshipRating BETWEEN 1 AND 5),
	ReliabilityRating INT CHECK (ReliabilityRating BETWEEN 1 AND 5),
	ReviewedLevel INT CHECK (ReviewedLevel BETWEEN 1 AND 3),
	FOREIGN KEY (ReviewerId) REFERENCES Person(UserId),
	FOREIGN KEY (ReviewedId) REFERENCES Person(UserId),
	FOREIGN KEY (TournamentId) REFERENCES Tournament(TournamentId),
	CHECK (ReviewerId <> ReviewedId),
	PRIMARY KEY(ReviewerId, ReviewedId),
)

--register a team in a tournament
CREATE TABLE TeamRegistration(
	TournamentId INT,
	TeamId INT,
	RegistrationDate DATETIME DEFAULT GETDATE(),
	FOREIGN KEY (TournamentId) REFERENCES Tournament(TournamentId),
	FOREIGN KEY (TeamId) REFERENCES Team(TeamId),
	PRIMARY KEY(TournamentId, TeamId)
);
GO

--register an user in a team
CREATE TABLE TeamMemberRegistration(
	UserId INT,
	TeamId INT,
	JoinedAt DATETIME DEFAULT GETDATE(),
	FOREIGN KEY (UserId) REFERENCES Person(UserId),
	FOREIGN KEY (TeamId) REFERENCES Team(TeamId),
	PRIMARY KEY(UserId, TeamId)
);
GO

CREATE TABLE Game(
    GameId INT IDENTITY(1,1) PRIMARY KEY,
    TournamentId INT FOREIGN KEY REFERENCES Tournament(TournamentId),
    RoundNumber NVARCHAR(50),
    GameTime DATETIME NOT NULL,
    Team1Id INT FOREIGN KEY REFERENCES Team(TeamId),
    Team2Id INT FOREIGN KEY REFERENCES Team(TeamId),
	CHECK (Team1Id <> Team2Id),
    ScoreTeam1 INT NULL CHECK (ScoreTeam1 >= 0),
	ScoreTeam2 INT NULL CHECK (ScoreTeam2 >= 0),
    GameStatus NVARCHAR(20) CHECK (GameStatus IN ('Scheduled', 'InProgress', 'Completed', 'Cancelled'))

);

