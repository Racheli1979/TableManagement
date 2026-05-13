GO
CREATE OR ALTER PROCEDURE DeleteRecord
    @TableName NVARCHAR(128),
    @RecordId NVARCHAR(450),
    @UpdateUser NVARCHAR(128), 
    @Reason NVARCHAR(MAX)      
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Sql NVARCHAR(MAX);
    DECLARE @PKColumnName NVARCHAR(128);
    DECLARE @OldData NVARCHAR(MAX); 

    EXEC ValidateColumnData @TableName = 'AuditLog', @ColumnName = 'Reason', @Value = @Reason;

    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = @TableName)
        BEGIN
            RAISERROR('Table not found in database.', 16, 1);
            RETURN;
        END

        SELECT TOP 1 @PKColumnName = c.name
        FROM sys.indexes i
        INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
        INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        WHERE i.is_primary_key = 1 AND OBJECT_NAME(i.object_id) = @TableName;

        SET @Sql = N'SET @Result = (SELECT * FROM ' + QUOTENAME(@TableName) + 
                   N' WHERE ' + QUOTENAME(@PKColumnName) + ' = @Id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)';
        EXEC sp_executesql @Sql, N'@Id NVARCHAR(450), @Result NVARCHAR(MAX) OUTPUT', @Id = @RecordId, @Result = @OldData OUTPUT;

        SET @Sql = 'DELETE FROM ' + QUOTENAME(@TableName) + 
                   ' WHERE ' + QUOTENAME(@PKColumnName) + ' = @Id';

        EXEC sp_executesql @Sql, N'@Id NVARCHAR(450)', @Id = @RecordId;

        IF @@ROWCOUNT = 0
        BEGIN
            RAISERROR('Record not found or already deleted.', 16, 1);
        END
        ELSE
        BEGIN

            INSERT INTO AuditLog (
                TableName, 
                RecordId, 
                Action, 
                UserName, 
                ChangeDate, 
                Reason, 
                OldValues, 
                NewValues
            )
            VALUES (
                @TableName, 
                @RecordId, 
                'DELETE', 
                @UpdateUser, 
                GETDATE(), 
                @Reason, 
                @OldData, 
                NULL
            );
        END
        
    END TRY
    BEGIN CATCH
        IF ERROR_NUMBER() = 547
        BEGIN
            RAISERROR('Cannot delete record: It is linked to other data (Foreign Key constraint).', 16, 1);
        END
        ELSE
        BEGIN
            DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
            RAISERROR(@ErrorMessage, 16, 1);
        END
    END CATCH
END
GO