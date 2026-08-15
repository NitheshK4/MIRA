-- Create Database
CREATE DATABASE AcieClientDb;
GO

USE AcieClientDb;
GO

-- 1. Clients Table
CREATE TABLE Clients (
    ClientId INT IDENTITY(1,1) PRIMARY KEY,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Phone VARCHAR(20),
    CreatedAt DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1
);

-- 2. Projects Table
CREATE TABLE Projects (
    ProjectId INT IDENTITY(1,1) PRIMARY KEY,
    ClientId INT NOT NULL,
    ProjectName VARCHAR(100) NOT NULL,
    Status VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'In Progress', 'Completed'
    Budget DECIMAL(18, 2),
    StartDate DATE,
    FOREIGN KEY (ClientId) REFERENCES Clients(ClientId) ON DELETE CASCADE
);

-- Insert Sample Data
INSERT INTO Clients (FirstName, LastName, Email, Phone)
VALUES 
('Bevinto', 'Paul', 'bevintop@gmail.com', '+1234567890'),
('John', 'Doe', 'john.doe@example.com', '+0987654321');

INSERT INTO Projects (ClientId, ProjectName, Status, Budget, StartDate)
VALUES 
(1, 'Acie Client Dashboard', 'In Progress', 5000.00, GETDATE());

-- Query Data
SELECT c.ClientId, c.FirstName, c.LastName, c.Email, p.ProjectName, p.Status 
FROM Clients c
LEFT JOIN Projects p ON c.ClientId = p.ClientId;
