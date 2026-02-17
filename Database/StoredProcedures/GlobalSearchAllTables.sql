ALTER PROCEDURE GlobalSearchAllTables
    @SearchTerm NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @SQL NVARCHAR(MAX) = '';
    DECLARE @Param NVARCHAR(110) = '%' + @SearchTerm + '%';

    -- בחר את כל הטבלאות והעמודות הרלוונטיות
    SELECT @SQL = @SQL + '
        SELECT 
            ''' + t.name + ''' AS TableName,
            ''' + c.name + ''' AS ColumnName,
            CAST(' + QUOTENAME(c.name) + ' AS NVARCHAR(MAX)) AS Value
        FROM ' + QUOTENAME(t.name) + '
        WHERE CAST(' + QUOTENAME(c.name) + ' AS NVARCHAR(MAX)) LIKE @Param
        UNION ALL
    '
    FROM sys.tables t
    JOIN sys.columns c ON t.object_id = c.object_id
    WHERE t.is_ms_shipped = 0
      AND c.is_computed = 0
      AND c.system_type_id IN (35, 99, 167, 175, 231, 239, 231, 104, 56, 52, 108, 106, 60, 61);

    -- הסרת UNION ALL האחרון בצורה בטוחה
    IF LEN(@SQL) > 0
    BEGIN
        -- הסרת 10 התווים האחרונים ('UNION ALL' + רווח/שורה)
        SET @SQL = LEFT(@SQL, LEN(@SQL) - LEN('
        UNION ALL'));
    END

    -- הרצת השאילתא הדינמית עם פרמטר
    IF LEN(@SQL) > 0
        EXEC sp_executesql @SQL, N'@Param NVARCHAR(110)', @Param=@Param;
END

go
EXEC GlobalSearchAllTables @SearchTerm = 'Eli';