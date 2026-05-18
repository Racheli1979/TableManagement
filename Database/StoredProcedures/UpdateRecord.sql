GO
CREATE PROCEDURE UpdateRecord
    @TableName NVARCHAR(128),
    @IdValue NVARCHAR(MAX), 
    @NewDataJson NVARCHAR(MAX),
    @UpdateUser NVARCHAR(128),
    @Reason NVARCHAR(MAX) 
AS
BEGIN
    SET NOCOUNT ON;

    EXEC ValidateColumnData @TableName = 'AuditLog', @ColumnName = 'Reason', @Value = @Reason;

    DECLARE @ColName NVARCHAR(128);
    DECLARE @ColVal NVARCHAR(MAX);

    DECLARE val_cursor CURSOR FOR 
    SELECT [key], [value] FROM OPENJSON(@NewDataJson);

    OPEN val_cursor;
    FETCH NEXT FROM val_cursor INTO @ColName, @ColVal;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        EXEC ValidateColumnData @TableName, @ColName, @ColVal;
        FETCH NEXT FROM val_cursor INTO @ColName, @ColVal;
    END
    CLOSE val_cursor;
    DEALLOCATE val_cursor;

    DECLARE @SQL NVARCHAR(MAX);
    DECLARE @OldValues NVARCHAR(MAX); 
    DECLARE @NewValues NVARCHAR(MAX); 
    DECLARE @UpdateSetClause NVARCHAR(MAX);

    BEGIN TRY
        SET @SQL = N'SELECT @Old = (SELECT * FROM ' + QUOTENAME(@TableName) + 
                   N' WHERE CAST(Id AS NVARCHAR(MAX)) = @Id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)';
        EXEC sp_executesql @SQL, N'@Id NVARCHAR(MAX), @Old NVARCHAR(MAX) OUTPUT', @Id = @IdValue, @Old = @OldValues OUTPUT;

        SELECT @UpdateSetClause = STRING_AGG(QUOTENAME([key]) + ' = JSON_VALUE(@Json, ''$.'' + ' + QUOTENAME([key], '''') + ')', ', ')
        FROM OPENJSON(@NewDataJson);

        SET @SQL = N'UPDATE ' + QUOTENAME(@TableName) + 
                   N' SET ' + @UpdateSetClause + N', 
                        UPDATE_USER = @User, 
                        UPDATE_DATE = GETDATE() 
                      WHERE CAST(Id AS NVARCHAR(MAX)) = @Id';

        EXEC sp_executesql @SQL, 
             N'@Json NVARCHAR(MAX), @User NVARCHAR(128), @Id NVARCHAR(MAX)', 
             @Json = @NewDataJson, 
             @User = @UpdateUser, 
             @Id = @IdValue;

        IF @@ROWCOUNT = 0
        BEGIN
            RAISERROR('Execution Error: No record found with the provided ID.', 16, 1);
        END

        SET @SQL = N'SELECT @New = (SELECT * FROM ' + QUOTENAME(@TableName) + 
                   N' WHERE CAST(Id AS NVARCHAR(MAX)) = @Id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)';
        EXEC sp_executesql @SQL, N'@Id NVARCHAR(MAX), @New NVARCHAR(MAX) OUTPUT', @Id = @IdValue, @New = @NewValues OUTPUT;

        INSERT INTO AuditLog (
            TableName, RecordId, Action, UserName, ChangeDate, Reason, OldValues, NewValues
        )
        VALUES (
            @TableName, @IdValue, 'UPDATE', @UpdateUser, GETDATE(), @Reason, @OldValues, @NewValues
        );

    END TRY
    BEGIN CATCH
        IF CURSOR_STATUS('global','val_cursor') >= 0 BEGIN CLOSE val_cursor; DEALLOCATE val_cursor; END
        ;THROW; 
    END CATCH
END