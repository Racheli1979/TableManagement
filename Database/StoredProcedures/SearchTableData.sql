GO
ALTER PROCEDURE SearchTableData
    @TableName NVARCHAR(128),
    @ColumnName NVARCHAR(128) = NULL,
    @SearchValue NVARCHAR(100) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 50
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @SQL NVARCHAR(MAX);
    DECLARE @ParamDefinition NVARCHAR(500) = 
        N'@Value NVARCHAR(100), @Offset INT, @PageSize INT';

    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = @TableName)
    BEGIN
        RAISERROR('Table does not exist', 16, 1);
        RETURN;
    END

    IF @SearchValue IS NULL OR @SearchValue = ''
    BEGIN
        SET @SQL = N'
            SELECT * 
            FROM ' + QUOTENAME(@TableName) + '
            ORDER BY (SELECT NULL)
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY';

        EXEC sp_executesql @SQL,
            N'@Offset INT, @PageSize INT',
            @Offset = @Offset,
            @PageSize = @PageSize;

        RETURN;
    END

    DECLARE @FullSearchValue NVARCHAR(110) = '%' + @SearchValue + '%';

    -- 🔍 חיפוש בעמודה ספציפית
    IF @ColumnName IS NOT NULL AND @ColumnName <> ''
    BEGIN
        SET @SQL = N'
            SELECT * 
            FROM ' + QUOTENAME(@TableName) + '
            WHERE CAST(ISNULL(' + QUOTENAME(@ColumnName) + ', '''') AS NVARCHAR(MAX)) LIKE @Value
            ORDER BY (SELECT NULL)
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY';
    END
    ELSE
    BEGIN
        -- 🔍 חיפוש גלובלי
        DECLARE @WhereClause NVARCHAR(MAX);

        SELECT @WhereClause = STRING_AGG(
            'CAST(ISNULL(' + QUOTENAME(COLUMN_NAME) + ', '''') AS NVARCHAR(MAX)) LIKE @Value',
            ' OR '
        )
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = @TableName
          AND DATA_TYPE IN ('char', 'varchar', 'nchar', 'nvarchar', 'text', 'ntext', 'int', 'decimal');

        SET @SQL = N'
            SELECT * 
            FROM ' + QUOTENAME(@TableName) + '
            WHERE ' + @WhereClause + '
            ORDER BY (SELECT NULL)
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY';
    END

    -- ▶️ הרצה
    EXEC sp_executesql 
        @SQL,
        @ParamDefinition,
        @Value = @FullSearchValue,
        @Offset = @Offset,
        @PageSize = @PageSize;
END
GO

EXEC SearchTableData 
    @TableName = 'Customers',
    @ColumnName = 'FirstName',
    @SearchValue = 'שרה';