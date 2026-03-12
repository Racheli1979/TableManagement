CREATE PROCEDURE GlobalSearchAllTables
    @SearchTerm NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    IF OBJECT_ID('tempdb..#Results') IS NOT NULL
        DROP TABLE #Results;

    CREATE TABLE #Results (
        TableName NVARCHAR(128),
        RowJson NVARCHAR(MAX)
    );

    DECLARE @TableName NVARCHAR(128);
    DECLARE @SQL NVARCHAR(MAX);
    DECLARE @Where NVARCHAR(MAX);

    DECLARE table_cursor CURSOR FOR
    SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE = 'BASE TABLE';

    OPEN table_cursor;
    FETCH NEXT FROM table_cursor INTO @TableName;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        SELECT @Where = STRING_AGG(
            'CAST(' + QUOTENAME(COLUMN_NAME) + ' AS NVARCHAR(MAX)) LIKE ''%' + @SearchTerm + '%''',
            ' OR '
        )
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = @TableName
        AND DATA_TYPE IN ('nvarchar','varchar','char','nchar','text','ntext');

        IF @Where IS NOT NULL
        BEGIN
            SET @SQL = '
                INSERT INTO #Results (TableName, RowJson)
                SELECT ''' + @TableName + ''',
                       (SELECT * FROM ' + QUOTENAME(@TableName) + '
                        WHERE ' + @Where + '
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)';
            EXEC sp_executesql @SQL;
        END

        FETCH NEXT FROM table_cursor INTO @TableName;
    END

    CLOSE table_cursor;
    DEALLOCATE table_cursor;

    SELECT
        TableName AS tableName,
        JSON_QUERY('[' + STRING_AGG(RowJson, ',') + ']') AS rowData
    FROM #Results
    GROUP BY TableName
    FOR JSON PATH;
END
GO