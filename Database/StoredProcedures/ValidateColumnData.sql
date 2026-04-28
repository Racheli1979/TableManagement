GO
CREATE PROCEDURE ValidateColumnData
    @TableName NVARCHAR(128),
    @ColumnName NVARCHAR(128),
    @Value NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    IF UPPER(ISNULL(@Value, '')) LIKE '%DROP %' OR UPPER(ISNULL(@Value, '')) LIKE '%DELETE %' 
       OR UPPER(ISNULL(@Value, '')) LIKE '%UPDATE %' OR UPPER(ISNULL(@Value, '')) LIKE '%SELECT %' 
       OR @Value LIKE '%--%'
    BEGIN
        ;THROW 50001, 'Security Violation: Forbidden SQL keyword detected.', 1;
    END

    DECLARE @DataType NVARCHAR(128), 
            @IsNullable NVARCHAR(10), 
            @MaxLength INT, 
            @IsIdentity INT,
            @HasDefault NVARCHAR(MAX);

    SELECT 
        @DataType = c.DATA_TYPE, 
        @IsNullable = c.IS_NULLABLE, 
        @MaxLength = c.CHARACTER_MAXIMUM_LENGTH,
        @IsIdentity = COLUMNPROPERTY(OBJECT_ID(@TableName), @ColumnName, 'IsIdentity'),
        @HasDefault = c.COLUMN_DEFAULT 
    FROM INFORMATION_SCHEMA.COLUMNS c
    WHERE c.TABLE_NAME = @TableName AND c.COLUMN_NAME = @ColumnName;

    IF @IsNullable = 'NO' 
       AND @IsIdentity = 0 
       AND @HasDefault IS NULL 
       AND (NULLIF(LTRIM(RTRIM(ISNULL(@Value, ''))), '') IS NULL)
    BEGIN
        DECLARE @ReqMsg NVARCHAR(200) = N'Validation Error: The field [' + @ColumnName + N'] is required.';
        ;THROW 50003, @ReqMsg, 1;
    END

    IF @MaxLength > 0 AND LEN(ISNULL(@Value, '')) > @MaxLength
    BEGIN
        DECLARE @LenMsg NVARCHAR(200) = N'Validation Error: Value in [' + @ColumnName + N'] exceeds max length of ' + CAST(@MaxLength AS NVARCHAR(10));
        ;THROW 50004, @LenMsg, 1;
    END

    IF @DataType IN ('int', 'decimal', 'numeric', 'float', 'real', 'bigint', 'smallint') 
       AND LTRIM(RTRIM(ISNULL(@Value, ''))) <> ''
    BEGIN
        IF ISNUMERIC(@Value) = 0
        BEGIN
            DECLARE @NumMsg NVARCHAR(200) = N'Validation Error: Value in [' + @ColumnName + N'] must be a valid number.';
            ;THROW 50005, @NumMsg, 1;
        END
    END
END
GO