GO
CREATE PROCEDURE AddNewRecord
    @TableName NVARCHAR(128),
    @JsonValues NVARCHAR(MAX), 
    @UpdateUser NVARCHAR(128)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ColName NVARCHAR(128);
    DECLARE @ColValue NVARCHAR(MAX); 

    DECLARE col_iterator CURSOR FOR 
    SELECT c.COLUMN_NAME, CAST(j.[value] AS NVARCHAR(MAX)) 
    FROM INFORMATION_SCHEMA.COLUMNS c
    LEFT JOIN OPENJSON(@JsonValues) j 
        ON j.[key] COLLATE DATABASE_DEFAULT = c.COLUMN_NAME COLLATE DATABASE_DEFAULT
    WHERE c.TABLE_NAME = @TableName;

    OPEN col_iterator;
    FETCH NEXT FROM col_iterator INTO @ColName, @ColValue;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        BEGIN TRY
            EXEC ValidateColumnData 
                @TableName = @TableName, 
                @ColumnName = @ColName, 
                @Value = @ColValue;
        END TRY
        BEGIN CATCH
            CLOSE col_iterator;
            DEALLOCATE col_iterator;
            ;THROW; 
            RETURN; 
        END CATCH

        FETCH NEXT FROM col_iterator INTO @ColName, @ColValue;
    END

    CLOSE col_iterator;
    DEALLOCATE col_iterator;

    DECLARE @Cols NVARCHAR(MAX), @Vals NVARCHAR(MAX), @SQL NVARCHAR(MAX);

    SELECT 
        @Cols = STRING_AGG(QUOTENAME([key]), ', '),
        @Vals = STRING_AGG('N''' + REPLACE(CAST([value] AS NVARCHAR(MAX)), '''', '''''') + '''', ', ')
    FROM OPENJSON(@JsonValues);

    SET @SQL = N'INSERT INTO ' + QUOTENAME(@TableName) + 
               N' (' + @Cols + N', CREATE_USER, CREATE_DATE, UPDATE_USER, UPDATE_DATE) 
               VALUES (' + @Vals + N', @User, GETDATE(), @User, GETDATE());';

    BEGIN TRY
        EXEC sp_executesql @SQL, N'@User NVARCHAR(128)', @User = @UpdateUser;
    END TRY
    BEGIN CATCH
        IF CURSOR_STATUS('global', 'col_iterator') >= -1
        BEGIN
            IF CURSOR_STATUS('global', 'col_iterator') >= 0 CLOSE col_iterator;
            DEALLOCATE col_iterator;
        END
        ;THROW; 
    END CATCH
END
GO