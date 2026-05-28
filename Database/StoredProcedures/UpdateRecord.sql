CREATE PROCEDURE UpdateRecord
    @TableName NVARCHAR(128),
    @IdValue NVARCHAR(450),
    @NewDataJson NVARCHAR(MAX),
    @UpdateUser NVARCHAR(128),
    @Reason NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    EXEC ValidateColumnData @TableName = @TableName, @JsonValues = @NewDataJson;

    DECLARE @PKColumn NVARCHAR(128);
    SELECT TOP 1 @PKColumn = QUOTENAME(c.name)
    FROM sys.index_columns ic
    JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE ic.object_id = OBJECT_ID(@TableName) AND ic.key_ordinal = 1;

    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @OldValues NVARCHAR(MAX), @SQL NVARCHAR(MAX);
        
        SET @SQL = N'SELECT @Old = (SELECT * FROM ' + QUOTENAME(@TableName) + 
                   N' WHERE ' + @PKColumn + N' COLLATE DATABASE_DEFAULT = @Id COLLATE DATABASE_DEFAULT FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)';
        
        EXEC sp_executesql @SQL, N'@Id NVARCHAR(450), @Old NVARCHAR(MAX) OUTPUT', @IdValue, @OldValues OUTPUT;

        DECLARE @SetClause NVARCHAR(MAX);
        SELECT @SetClause = STRING_AGG(QUOTENAME([key]) + ' = JSON_VALUE(@Json, ''$.'' + ' + QUOTENAME([key], '''') + ')', ', ')
        FROM OPENJSON(@NewDataJson)
        WHERE [key] COLLATE DATABASE_DEFAULT IN (SELECT name COLLATE DATABASE_DEFAULT FROM sys.columns WHERE object_id = OBJECT_ID(@TableName));

        SET @SQL = N'UPDATE ' + QUOTENAME(@TableName) + N' SET ' + @SetClause + 
                   N', UPDATE_USER = @User, UPDATE_DATE = GETDATE() WHERE ' + @PKColumn + N' COLLATE DATABASE_DEFAULT = @Id COLLATE DATABASE_DEFAULT';
        
        EXEC sp_executesql @SQL, N'@Json NVARCHAR(MAX), @User NVARCHAR(128), @Id NVARCHAR(450)', 
                           @NewDataJson, @UpdateUser, @IdValue;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO