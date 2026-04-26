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

    IF UPPER(@NewValue) LIKE '%DROP %' 
       OR UPPER(@NewValue) LIKE '%DELETE %' 
       OR UPPER(@NewValue) LIKE '%UPDATE %' 
       OR UPPER(@NewValue) LIKE '%SELECT %' 
       OR UPPER(@NewValue) LIKE '%TRUNCATE %' 
       OR @NewValue LIKE '%--%'
    BEGIN
        RAISERROR('Security Violation: Forbidden SQL keyword detected in data.', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1 FROM sys.columns c 
        JOIN sys.tables t ON c.object_id = t.object_id 
        WHERE t.name = @TableName AND c.name = @ColumnName
    )
    BEGIN
        RAISERROR('Security Violation: Invalid Table or Column name.', 16, 1);
        RETURN;
    END

    DECLARE @DataType NVARCHAR(128);
    DECLARE @IsNullable NVARCHAR(10);
    DECLARE @MaxLength INT;

    SELECT 
        @DataType = DATA_TYPE,
        @IsNullable = IS_NULLABLE,
        @MaxLength = CHARACTER_MAXIMUM_LENGTH
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = @TableName AND COLUMN_NAME = @ColumnName;

    IF @IsNullable = 'NO' AND (NULLIF(LTRIM(RTRIM(@NewValue)), '') IS NULL)
    BEGIN
        RAISERROR('Validation Error: This field is required and cannot be empty.', 16, 1);
        RETURN;
    END

    IF @MaxLength > 0 AND LEN(@NewValue) > @MaxLength
    BEGIN
        DECLARE @Msg NVARCHAR(200) = 'Validation Error: Value exceeds maximum length of ' + CAST(@MaxLength AS NVARCHAR(10));
        RAISERROR(@Msg, 16, 1);
        RETURN;
    END

    IF @DataType IN ('int', 'decimal', 'numeric', 'float', 'real', 'bigint', 'smallint') 
       AND LTRIM(RTRIM(@NewValue)) <> ''
    BEGIN
        IF ISNUMERIC(@NewValue) = 0
        BEGIN
            RAISERROR('Validation Error: Provided value is not a valid number.', 16, 1);
            RETURN;
        END
    END

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
            RETURN;
        END
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();

        RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO