CREATE PROCEDURE ValidateColumnData
    @TableName NVARCHAR(128),
    @JsonValues NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1 FROM OPENJSON(@JsonValues)
        WHERE value COLLATE DATABASE_DEFAULT LIKE '%DROP%' COLLATE DATABASE_DEFAULT
           OR value COLLATE DATABASE_DEFAULT LIKE '%DELETE%' COLLATE DATABASE_DEFAULT
           OR value COLLATE DATABASE_DEFAULT LIKE '%UPDATE%' COLLATE DATABASE_DEFAULT
           OR value COLLATE DATABASE_DEFAULT LIKE '%SELECT%' COLLATE DATABASE_DEFAULT
           OR value COLLATE DATABASE_DEFAULT LIKE '%TRUNCATE%' COLLATE DATABASE_DEFAULT
           OR value LIKE '%--%'
    ) THROW 50001, 'Security Violation: Forbidden SQL keyword detected.', 1;

    IF EXISTS (SELECT 1 FROM OPENJSON(@JsonValues) j 
               JOIN INFORMATION_SCHEMA.COLUMNS c ON c.COLUMN_NAME COLLATE DATABASE_DEFAULT = j.[key] COLLATE DATABASE_DEFAULT 
               WHERE c.TABLE_NAME COLLATE DATABASE_DEFAULT = @TableName COLLATE DATABASE_DEFAULT 
               AND c.IS_NULLABLE = 'NO' 
               AND COLUMNPROPERTY(OBJECT_ID(c.TABLE_SCHEMA + '.' + c.TABLE_NAME), c.COLUMN_NAME, 'IsIdentity') = 0 
               AND c.COLUMN_DEFAULT IS NULL 
               AND (j.value IS NULL OR LTRIM(RTRIM(j.value)) = ''))
        THROW 50003, 'Validation Error: Required field is missing.', 1;

    IF EXISTS (SELECT 1 FROM OPENJSON(@JsonValues) j 
               JOIN INFORMATION_SCHEMA.COLUMNS c ON c.COLUMN_NAME COLLATE DATABASE_DEFAULT = j.[key] COLLATE DATABASE_DEFAULT 
               WHERE c.TABLE_NAME COLLATE DATABASE_DEFAULT = @TableName COLLATE DATABASE_DEFAULT 
               AND c.CHARACTER_MAXIMUM_LENGTH > 0 
               AND LEN(ISNULL(j.value, '')) > c.CHARACTER_MAXIMUM_LENGTH)
        THROW 50004, 'Validation Error: Value exceeds max length.', 1;

    IF EXISTS (SELECT 1 FROM OPENJSON(@JsonValues) j 
               JOIN INFORMATION_SCHEMA.COLUMNS c ON c.COLUMN_NAME COLLATE DATABASE_DEFAULT = j.[key] COLLATE DATABASE_DEFAULT 
               WHERE c.TABLE_NAME COLLATE DATABASE_DEFAULT = @TableName COLLATE DATABASE_DEFAULT 
               AND c.DATA_TYPE IN ('int', 'decimal', 'numeric', 'float', 'real', 'bigint', 'smallint') 
               AND LTRIM(RTRIM(j.value)) <> '' 
               AND ISNUMERIC(j.value) = 0)
        THROW 50005, 'Validation Error: Must be a valid number.', 1;

    IF EXISTS (SELECT 1 FROM OPENJSON(@JsonValues) j 
               WHERE (j.[key] LIKE '%Name%' OR j.[key] LIKE N'%שם%') 
               AND LTRIM(RTRIM(j.value)) <> '' 
               AND (j.value LIKE '%[{}]%' OR j.value LIKE '%[<>]%' OR j.value LIKE '%[#$^*]%'))
        THROW 50006, 'Validation Error: Invalid characters detected in name field.', 1;

    IF EXISTS (SELECT 1 FROM OPENJSON(@JsonValues) j 
               JOIN INFORMATION_SCHEMA.COLUMNS c ON c.COLUMN_NAME COLLATE DATABASE_DEFAULT = j.[key] COLLATE DATABASE_DEFAULT 
               WHERE c.TABLE_NAME COLLATE DATABASE_DEFAULT = @TableName COLLATE DATABASE_DEFAULT 
               AND c.DATA_TYPE IN ('datetime', 'date', 'datetime2', 'smalldatetime') 
               AND LTRIM(RTRIM(j.value)) <> '' AND ISDATE(j.value) = 0)
        THROW 50007, 'Validation Error: Must be a valid date.', 1;

    IF EXISTS (SELECT 1 FROM OPENJSON(@JsonValues) j 
               JOIN INFORMATION_SCHEMA.COLUMNS c ON c.COLUMN_NAME COLLATE DATABASE_DEFAULT = j.[key] COLLATE DATABASE_DEFAULT 
               WHERE c.TABLE_NAME COLLATE DATABASE_DEFAULT = @TableName COLLATE DATABASE_DEFAULT 
               AND c.DATA_TYPE IN ('datetime', 'date', 'datetime2', 'smalldatetime') 
               AND TRY_CAST(j.value AS DATETIME) > GETDATE())
        THROW 50009, 'Validation Error: Date cannot be in the future.', 1;

    IF EXISTS (SELECT 1 FROM OPENJSON(@JsonValues) j 
               JOIN INFORMATION_SCHEMA.COLUMNS c ON c.COLUMN_NAME COLLATE DATABASE_DEFAULT = j.[key] COLLATE DATABASE_DEFAULT 
               WHERE c.TABLE_NAME COLLATE DATABASE_DEFAULT = @TableName COLLATE DATABASE_DEFAULT 
               AND c.DATA_TYPE IN ('datetime', 'date', 'datetime2', 'smalldatetime') 
               AND TRY_CAST(j.value AS DATETIME) < DATEADD(YEAR, -1, GETDATE()))
        THROW 50010, 'Validation Error: Date is too old.', 1;
END
GO