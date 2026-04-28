GO
CREATE PROCEDURE UpdateRecord
    @TableName NVARCHAR(128),
    @ColumnName NVARCHAR(128),
    @NewValue NVARCHAR(MAX),
    @IdValue NVARCHAR(MAX), 
    @UpdateUser NVARCHAR(128)
AS
BEGIN
    SET NOCOUNT ON;

    EXEC ValidateColumnData @TableName, @ColumnName, @NewValue;

    DECLARE @SQL NVARCHAR(MAX);
    
    SET @SQL = N'UPDATE ' + QUOTENAME(@TableName) + 
               N' SET ' + QUOTENAME(@ColumnName) + N' = @Val, 
                    UPDATE_USER = @User, 
                    UPDATE_DATE = GETDATE() 
                  WHERE CAST(Id AS NVARCHAR(MAX)) = @Id';

    BEGIN TRY
        EXEC sp_executesql @SQL, 
             N'@Val NVARCHAR(MAX), @User NVARCHAR(128), @Id NVARCHAR(MAX)', 
             @Val = @NewValue, 
             @User = @UpdateUser, 
             @Id = @IdValue;

        IF @@ROWCOUNT = 0
        BEGIN
            RAISERROR('Execution Error: No record found with the provided ID.', 16, 1);
        END
    END TRY
    BEGIN CATCH
        THROW; 
    END CATCH
END