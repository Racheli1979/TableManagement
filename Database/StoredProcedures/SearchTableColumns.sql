GO
CREATE PROCEDURE SearchTableColumns
    @TableName NVARCHAR(128),
    @Columns NVARCHAR(MAX),
    @SearchValue NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    IF LEN(@SearchValue) > 100
        THROW 50001, 'Search value too long', 1;

    IF @TableName LIKE '%[^a-zA-Z0-9_]%'
        THROW 50000, 'Invalid table name', 1;

    IF NOT EXISTS (
        SELECT 1 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = @TableName
    )
        THROW 50002, 'Table does not exist', 1;

    DECLARE @InvalidColumnCount INT;

    DECLARE @Cols TABLE (ColumnName NVARCHAR(128));

    INSERT INTO @Cols (ColumnName)
    SELECT TRIM(value)
    FROM STRING_SPLIT(@Columns, ',');

    SELECT @InvalidColumnCount = COUNT(*)
    FROM @Cols
    WHERE ColumnName LIKE '%[^a-zA-Z0-9_]%';

    IF @InvalidColumnCount > 0
        THROW 50004, 'Invalid column name', 1;

    SELECT @InvalidColumnCount = COUNT(*)
    FROM @Cols c
    WHERE NOT EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = @TableName
        AND COLUMN_NAME = c.ColumnName
    );

    IF @InvalidColumnCount > 0
        THROW 50003, 'Column does not exist', 1;

    DECLARE @SQL NVARCHAR(MAX) = N'SELECT * FROM ' + QUOTENAME(@TableName) + N' WHERE ';
    DECLARE @SearchPattern NVARCHAR(1024) = '%' + @SearchValue + '%';

    SELECT @SQL += STRING_AGG(
        QUOTENAME(ColumnName) + ' LIKE @Value',
        ' OR '
    )
    FROM @Cols;

    EXEC sp_executesql
        @SQL,
        N'@Value NVARCHAR(100)',
        @Value = @SearchPattern;
END
GO