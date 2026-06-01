-- יצירת בסיס הנתונים
CREATE DATABASE TableManagementDB;
GO

-- שימוש בבסיס הנתונים שנוצר
USE TableManagementDB;
GO

-- 1. טבלת סטטוס
CREATE TABLE Status (
    Id INT PRIMARY KEY IDENTITY(1,1) NOT NULL,
    StatusName NVARCHAR(50) NOT NULL,
	CREATE_DATE DATETIME2 DEFAULT GETDATE(),
    CREATE_USER NVARCHAR(50),
    UPDATE_DATE DATETIME2 DEFAULT GETDATE(),
    UPDATE_USER NVARCHAR(50)
);

-- 2. טבלת לקוחות 
CREATE TABLE Customers (
    Id NVARCHAR(50) PRIMARY KEY NOT NULL,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(150),
    City NVARCHAR(100),
    StatusId INT, -- קשר לטבלת סטטוס
    CREATE_DATE DATETIME2 DEFAULT GETDATE(),
    CREATE_USER NVARCHAR(50),
    UPDATE_DATE DATETIME2 DEFAULT GETDATE(),
    UPDATE_USER NVARCHAR(50),
    CONSTRAINT FK_Customers_Status FOREIGN KEY (StatusId) REFERENCES Status(Id)
);

-- 3. טבלת הזמנות (כולל קשר ללקוח וסטטוס)
CREATE TABLE Orders (
    Id NVARCHAR(50) PRIMARY KEY NOT NULL,
    CustomerId NVARCHAR(50) NOT NULL,
    OrderDate DATE,
    StatusId INT NOT NULL,
    TotalAmount DECIMAL(18, 2) DEFAULT 0,
    CREATE_DATE DATETIME2 DEFAULT GETDATE(),
    CREATE_USER NVARCHAR(50),
    UPDATE_DATE DATETIME2 DEFAULT GETDATE(),
    UPDATE_USER NVARCHAR(50),
    CONSTRAINT FK_Orders_Customers FOREIGN KEY (CustomerId) REFERENCES Customers(Id),
    CONSTRAINT FK_Orders_Status FOREIGN KEY (StatusId) REFERENCES Status(Id)
);

-- 4. טבלת לוג
CREATE TABLE AuditLog (
    Id INT PRIMARY KEY IDENTITY(1,1) NOT NULL,
    TableName NVARCHAR(100),
    RecordId NVARCHAR(100),
    Action NVARCHAR(50), -- INSERT / UPDATE / DELETE
    UserName NVARCHAR(100),
    ChangeDate DATETIME2 DEFAULT GETDATE(),
    Reason NVARCHAR(MAX), -- סיבת השינוי
    OldValues NVARCHAR(MAX), -- תיעוד JSON של הערכים הישנים
    NewValues NVARCHAR(MAX)  -- תיעוד JSON של הערכים החדשים
);

-- 5. טבלת הרשאות משתמש
CREATE TABLE UserPermissions (
    Id INT PRIMARY KEY IDENTITY(1,1) NOT NULL,
    UserName NVARCHAR(100),
    TableName NVARCHAR(100),
    CanView BIT DEFAULT 0,
    CanEdit BIT DEFAULT 0,
    CanAdd BIT DEFAULT 0,
    CanDelete BIT DEFAULT 0,
    CreatedDate DATETIME2 DEFAULT GETDATE(),
    CreatedBy NVARCHAR(100)
);

-- 1. הכנסת סטטוסים
INSERT INTO Status (StatusName) VALUES 
('Pending'), ('Completed'), ('Cancelled'), ('Processing'), ('Shipped');

-- 2. הכנסת לקוחות
INSERT INTO Customers (Id, FirstName, LastName, Email, City, StatusId, CREATE_USER) VALUES 
('WnwDfNq1YzZB5j3UHMea', N'יעקב', N'כהן', 'jacob@test.com', N'ירושלים', 1, 'Admin'),
('A1B2C3D4E5F6G7H8I9J0', N'שרה', N'לוי', 'sarah@test.com', N'בני ברק', 2, 'Admin'),
('K1L2M3N4O5P6Q7R8S9T0', N'משה', N'מזרחי', 'moshe@test.com', N'תל אביב', 1, 'Admin'),
('U1V2W3X4Y5Z6A7B8C9D0', N'רבקה', N'אברהם', 'rivka@test.com', N'חיפה', 3, 'Admin'),
('E1F2G3H4I5J6K7L8M9N0', N'דוד', N'ישראלי', 'david@test.com', N'אשדוד', 2, 'Admin');

-- 3. הכנסת הזמנות (מקושרות ללקוחות למעלה)
INSERT INTO Orders (Id, CustomerId, OrderDate, StatusId, TotalAmount, CREATE_USER) VALUES 
('PiUPE8k8L02Jpup9HCqm', 'WnwDfNq1YzZB5j3UHMea', '2025-11-10', 1, 5.00, 'Admin'),
('ORD-7788990011223344', 'A1B2C3D4E5F6G7H8I9J0', '2025-11-11', 2, 150.50, 'Admin'),
('ORD-5544332211009988', 'K1L2M3N4O5P6Q7R8S9T0', '2025-11-12', 4, 3200.00, '06298626176519159598'),
('ORD-1122334455667788', 'WnwDfNq1YzZB5j3UHMea', '2025-11-13', 1, 45.90, 'Admin'),
('ORD-9988776655443322', 'E1F2G3H4I5J6K7L8M9N0', '2025-11-14', 5, 120.00, '06298626176519159598');

-- 4. הכנסת לוגים 
INSERT INTO AuditLog (TableName, RecordId, Action, UserName, Reason, NewValues) VALUES 
('Customers', 'WnwDfNq1YzZB5j3UHMea', 'INSERT', '06298626176519159598', N'הוספת לקוח חדש', '{"firstName":"יעקב","lastName":"כהן","email":"jacob@test.com"}'),
('Orders', 'PiUPE8k8L02Jpup9HCqm', 'INSERT', '06298626176519159598', N'הוספת הזמנה', '{"orderDate":"2025-11-10","total":5}'),
('Customers', 'A1B2C3D4E5F6G7H8I9J0', 'UPDATE', 'Admin', N'עדכון כתובת אימייל', '{"email":"sarah_new@test.com"}'),
('Orders', 'ORD-7788990011223344', 'UPDATE', 'Admin', N'שינוי סטטוס למושלם', '{"statusId":2}'),
('Customers', 'K1L2M3N4O5P6Q7R8S9T0', 'INSERT', 'Admin', N'יבוא נתונים ראשוני', '{"firstName":"משה"}');

-- 5. הכנסת הרשאות משתמש
INSERT INTO UserPermissions (UserName, TableName, CanView, CanEdit, CanAdd, CanDelete, CreatedBy) VALUES 
('06298626176519159598', 'Customers', 1, 1, 1, 1, 'System'),
('06298626176519159598', 'Orders', 1, 1, 1, 1, 'System'),
('GuestUser', 'Customers', 1, 0, 0, 0, 'Admin'), -- אורח יכול רק לצפות
('GuestUser', 'Orders', 1, 0, 0, 0, 'Admin'),
('Manager', 'Orders', 1, 1, 1, 1, 'Admin'); -- מנהל יכול הכל חוץ מלמחוק