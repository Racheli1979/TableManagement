CREATE PROCEDURE SearchTableData
    @TableName NVARCHAR(128),
    @ColumnName NVARCHAR(128) = NULL,
    @SearchValue NVARCHAR(100) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 50
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @SQL NVARCHAR(MAX);
    DECLARE @JoinSQL NVARCHAR(MAX) = '';
    DECLARE @SelectSQL NVARCHAR(MAX) = 'SELECT t.*';
    DECLARE @WhereClause NVARCHAR(MAX) = '1=1';
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    DECLARE @ParamDefinition NVARCHAR(500) = N'@Value NVARCHAR(110), @Offset INT, @PageSize INT';

    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = @TableName)
    BEGIN
        RAISERROR('Table does not exist', 16, 1);
        RETURN;
    END

    SELECT 
        @JoinSQL = @JoinSQL + CHAR(13) + 
            ' LEFT JOIN ' + QUOTENAME(rt.name) + ' AS [j_' + c.name + '] ' +
            ' ON t.' + QUOTENAME(c.name) + ' = [j_' + c.name + '].' + QUOTENAME(rc.name),
        
        @SelectSQL = @SelectSQL + ', [j_' + c.name + '].' + 
            QUOTENAME(COALESCE(
                (SELECT TOP 1 name FROM sys.columns WHERE object_id = rt.object_id AND name LIKE '%Name%'),
                rc.name
            )) + ' AS ' + QUOTENAME(c.name + '_Display')
    FROM sys.foreign_key_columns fkc
    JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
    JOIN sys.tables rt ON fkc.referenced_object_id = rt.object_id
    JOIN sys.columns rc ON fkc.referenced_object_id = rc.object_id AND fkc.referenced_column_id = rc.column_id
    WHERE fkc.parent_object_id = OBJECT_ID(@TableName);

    IF @SearchValue IS NOT NULL AND @SearchValue <> ''
    BEGIN
        IF @ColumnName IS NOT NULL AND @ColumnName <> ''
            SET @WhereClause = 'CAST(t.' + QUOTENAME(@ColumnName) + ' AS NVARCHAR(MAX)) LIKE @Value';
        ELSE
        BEGIN
            SELECT @WhereClause = STRING_AGG(
                'CAST(ISNULL(t.' + QUOTENAME(COLUMN_NAME) + ', '''') AS NVARCHAR(MAX)) LIKE @Value',
                ' OR '
            )
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = @TableName 
              AND (TABLE_SCHEMA = 'dbo' OR TABLE_SCHEMA = (SELECT SCHEMA_NAME()))
              AND DATA_TYPE IN ('char', 'varchar', 'nchar', 'nvarchar', 'int', 'decimal');
        END
    END

    SET @SQL = @SelectSQL + 
               ' FROM ' + QUOTENAME(@TableName) + ' AS t ' + 
               @JoinSQL + 
               ' WHERE ' + @WhereClause + 
               ' ORDER BY (SELECT NULL) ' + 
               ' OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY';

    DECLARE @FullSearchValue NVARCHAR(110) = '%' + @SearchValue + '%';
    EXEC sp_executesql @SQL, @ParamDefinition, 
         @Value = @FullSearchValue, @Offset = @Offset, @PageSize = @PageSize;
END
GO 