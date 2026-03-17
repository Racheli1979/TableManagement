CREATE PROCEDURE SearchTableData
    @TableName NVARCHAR(128),
    @ColumnName NVARCHAR(128) = NULL, -- NULL לחיפוש בכל הטבלה, שם עמודה לחיפוש פרטני
    @SearchValue NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @SQL NVARCHAR(MAX);
    DECLARE @ParamDefinition NVARCHAR(500) = N'@Value NVARCHAR(100)';
    DECLARE @FullSearchValue NVARCHAR(110) = '%' + @SearchValue + '%';

    -- ולידציה בסיסית ששם הטבלה קיים במערכת (מניעת הזרקה)
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = @TableName)
    BEGIN
        RETURN; -- או לזרוק שגיאה
    END

    IF @ColumnName IS NOT NULL AND @ColumnName <> ''
    BEGIN
        -- 1. חיפוש פרטני (משימה: "חיפוש בכל עמודה בנפרד")
        SET @SQL = N'SELECT * FROM ' + QUOTENAME(@TableName) + 
                   N' WHERE ' + QUOTENAME(@ColumnName) + N' LIKE @Value';
    END
    ELSE
    BEGIN
        -- 2. חיפוש גלובלי בטבלה (משימה: "חיפוש גלובלי בנתוני הטבלה")
        DECLARE @WhereClause NVARCHAR(MAX);
        
        -- בונים את ה-WHERE אוטומטית לכל העמודות הטקסטואליות
        SELECT @WhereClause = STRING_AGG('CAST(' + QUOTENAME(COLUMN_NAME) + ' AS NVARCHAR(MAX)) LIKE @Value', ' OR ')
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = @TableName 
          AND DATA_TYPE IN ('char', 'varchar', 'nchar', 'nvarchar', 'text', 'ntext', 'int', 'decimal');

        SET @SQL = N'SELECT * FROM ' + QUOTENAME(@TableName) + N' WHERE ' + @WhereClause;
    END

    -- הרצה בטוחה עם Bind Variable
    EXEC sp_executesql @SQL, @ParamDefinition, @Value = @FullSearchValue;
END
GO