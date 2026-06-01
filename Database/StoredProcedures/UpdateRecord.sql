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

    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = @TableName)
    BEGIN
        RAISERROR('Invalid Table Name', 16, 1);
        RETURN;
    END

    EXEC ValidateColumnData @TableName = @TableName, @JsonValues = @NewDataJson;

    DECLARE @PKColumn NVARCHAR(128), @IsNumericPK BIT;
    SELECT TOP 1 @PKColumn = QUOTENAME(c.name),
                 @IsNumericPK = CASE WHEN t.name IN ('int', 'bigint', 'smallint', 'tinyint', 'decimal', 'numeric') THEN 1 ELSE 0 END
    FROM sys.index_columns ic
    JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    JOIN sys.types t ON c.user_type_id = t.user_type_id
    WHERE ic.object_id = OBJECT_ID(@TableName) AND ic.key_ordinal = 1;

    DECLARE @WhereClause NVARCHAR(MAX);
    SET @WhereClause = CASE 
        WHEN @IsNumericPK = 1 THEN @PKColumn + N' = CAST(@Id AS FLOAT)'
        ELSE @PKColumn + N' COLLATE DATABASE_DEFAULT = @Id COLLATE DATABASE_DEFAULT'
    END;

    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @SQL NVARCHAR(MAX), @OldValues NVARCHAR(MAX);

        SET @SQL = N'SELECT @Old = (SELECT * FROM ' + QUOTENAME(@TableName) + N' WHERE ' + @WhereClause + N' FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)';
        EXEC sp_executesql @SQL, N'@Id NVARCHAR(450), @Old NVARCHAR(MAX) OUTPUT', @IdValue, @OldValues OUTPUT;

        DECLARE @SetClause NVARCHAR(MAX);
        SELECT @SetClause = STRING_AGG(QUOTENAME([key]) + ' = JSON_VALUE(@Json, ''$.'' + ' + QUOTENAME([key], '''') + ')', ', ')
        FROM OPENJSON(@NewDataJson)
        WHERE [key] COLLATE DATABASE_DEFAULT IN (SELECT name COLLATE DATABASE_DEFAULT FROM sys.columns WHERE object_id = OBJECT_ID(@TableName));

        SET @SQL = N'UPDATE ' + QUOTENAME(@TableName) + N' SET ' + @SetClause + 
                   N', UPDATE_USER = @User COLLATE DATABASE_DEFAULT, UPDATE_DATE = GETDATE() WHERE ' + @WhereClause;
        
        EXEC sp_executesql @SQL, N'@Json NVARCHAR(MAX), @User NVARCHAR(128), @Id NVARCHAR(450)', 
                           @NewDataJson, @UpdateUser, @IdValue;

        INSERT INTO AuditLog (TableName, RecordId, Action, UserName, ChangeDate, Reason, OldValues, NewValues)
        VALUES (@TableName, @IdValue, 'UPDATE', @UpdateUser, GETDATE(), @Reason, @OldValues, @NewDataJson);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO