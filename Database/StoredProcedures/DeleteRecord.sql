CREATE PROCEDURE DeleteRecord
    @TableName NVARCHAR(128),
    @RecordId NVARCHAR(450),
    @UpdateUser NVARCHAR(128), 
    @Reason NVARCHAR(MAX)      
AS
BEGIN
    SET NOCOUNT ON;
    
    EXEC ValidateColumnData @TableName = 'AuditLog', @JsonValues = '{"Reason": "Checked"}'; 

    DECLARE @PKColumnName NVARCHAR(128);
    DECLARE @OldData NVARCHAR(MAX); 
    DECLARE @Sql NVARCHAR(MAX);

    SELECT TOP 1 @PKColumnName = QUOTENAME(c.name)
    FROM sys.index_columns ic
    JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE ic.object_id = OBJECT_ID(@TableName) AND ic.key_ordinal = 1;

    IF @PKColumnName IS NULL
    BEGIN
        RAISERROR('Table not found or has no Primary Key.', 16, 1);
        RETURN;
    END

    BEGIN TRANSACTION;
    BEGIN TRY
        SET @Sql = N'SELECT @Result = (SELECT * FROM ' + QUOTENAME(@TableName) + 
                   N' WHERE ' + @PKColumnName + N' = @Id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)';
        
        EXEC sp_executesql @Sql, N'@Id NVARCHAR(450), @Result NVARCHAR(MAX) OUTPUT', 
                           @Id = @RecordId, @Result = @OldData OUTPUT;

        IF @OldData IS NULL
        BEGIN
            RAISERROR('Record not found.', 16, 1);
        END

        SET @Sql = N'DELETE FROM ' + QUOTENAME(@TableName) + N' WHERE ' + @PKColumnName + N' = @Id';
        EXEC sp_executesql @Sql, N'@Id NVARCHAR(450)', @Id = @RecordId;

        INSERT INTO AuditLog (TableName, RecordId, Action, UserName, ChangeDate, Reason, OldValues)
        VALUES (@TableName, @RecordId, 'DELETE', @UpdateUser, GETDATE(), @Reason, @OldData);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        
        IF ERROR_NUMBER() = 547
            RAISERROR('Cannot delete: Record is linked to other data.', 16, 1);
        ELSE
            THROW;
    END CATCH
END
GO