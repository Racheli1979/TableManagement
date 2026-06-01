CREATE PROCEDURE AddNewRecord
    @TableName NVARCHAR(128),
    @JsonValues NVARCHAR(MAX), 
    @UpdateUser NVARCHAR(128),
    @Reason NVARCHAR(MAX) 
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    EXEC ValidateColumnData @TableName = @TableName, @JsonValues = @JsonValues;

    DECLARE @Cols NVARCHAR(MAX), @SQL NVARCHAR(MAX);
    DECLARE @ObjectId INT = OBJECT_ID(@TableName);

    SELECT @Cols = STRING_AGG(QUOTENAME(name), ', ')
    FROM sys.columns 
    WHERE object_id = @ObjectId
      AND name NOT IN ('CREATE_USER', 'CREATE_DATE', 'UPDATE_USER', 'UPDATE_DATE')
      AND COLUMNPROPERTY(object_id, name, 'IsIdentity') = 0; 

    SET @SQL = N'INSERT INTO ' + QUOTENAME(@TableName) + 
               N' (' + @Cols + N', CREATE_USER, CREATE_DATE, UPDATE_USER, UPDATE_DATE) ' +
               N' SELECT ' + @Cols + N', @User, GETDATE(), @User, GETDATE() ' +
               N' FROM OPENJSON(@Json) WITH (' + 
               (SELECT STRING_AGG(QUOTENAME(name) + N' NVARCHAR(MAX) ''$.' + name + N'''', N', ') 
                FROM sys.columns WHERE object_id = @ObjectId) + N')';

    BEGIN TRY
        BEGIN TRANSACTION;

        EXEC sp_executesql @SQL, N'@Json NVARCHAR(MAX), @User NVARCHAR(128)', @Json = @JsonValues, @User = @UpdateUser;

        INSERT INTO AuditLog (TableName, RecordId, Action, UserName, ChangeDate, Reason, NewValues)
        VALUES (@TableName, SCOPE_IDENTITY(), 'INSERT', @UpdateUser, GETDATE(), @Reason, @JsonValues);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH
END
GO