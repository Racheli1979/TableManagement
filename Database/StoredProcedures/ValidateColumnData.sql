GO
CREATE OR ALTER PROCEDURE ValidateColumnData
    @TableName NVARCHAR(128),
    @ColumnName NVARCHAR(128),
    @Value NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    IF UPPER(ISNULL(@Value, '')) LIKE '%DROP%' OR UPPER(ISNULL(@Value, '')) LIKE '%DELETE%' 
       OR UPPER(ISNULL(@Value, '')) LIKE '%UPDATE%' OR UPPER(ISNULL(@Value, '')) LIKE '%SELECT%' 
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

    IF (@ColumnName LIKE '%Name%' OR @ColumnName LIKE '%שם%') 
       AND LTRIM(RTRIM(ISNULL(@Value, ''))) <> ''
    BEGIN
        IF @Value LIKE '%[{}]%' OR @Value LIKE '%[<>]%' OR @Value LIKE '%[#$^*]%'
        BEGIN
            DECLARE @NameMsg NVARCHAR(200) = N'Validation Error: Invalid characters detected in name field [' + @ColumnName + N'].';
            ;THROW 50006, @NameMsg, 1;
        END
    END

    IF @DataType IN ('datetime', 'date', 'datetime2', 'smalldatetime') 
       AND LTRIM(RTRIM(ISNULL(@Value, ''))) <> ''
    BEGIN
        IF ISDATE(@Value) = 0
        BEGIN
            DECLARE @DateMsg NVARCHAR(200) = N'Validation Error: Value in [' + @ColumnName + N'] must be a valid date.';
            ;THROW 50007, @DateMsg, 1;
        END
        
        DECLARE @InputDate DATETIME = CAST(@Value AS DATETIME);

        IF @InputDate > GETDATE()
        BEGIN
            DECLARE @FutureMsg NVARCHAR(200) = N'Validation Error: Date in [' + @ColumnName + N'] cannot be in the future.';
            ;THROW 50009, @FutureMsg, 1;
        END

        IF @InputDate < DATEADD(YEAR, -1, GETDATE())
        BEGIN
            DECLARE @OldMsg NVARCHAR(200) = N'Validation Error: Date in [' + @ColumnName + N'] is too old (more than 1 year ago).';
            ;THROW 50010, @OldMsg, 1;
        END
    END

END
GO