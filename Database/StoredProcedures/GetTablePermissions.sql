CREATE PROCEDURE GetTablePermissions
    @TableName NVARCHAR(128),
    @UserName NVARCHAR(128)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @JsonValidation NVARCHAR(MAX) = (
        SELECT @TableName AS [TableName], @UserName AS [UserName] 
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    );
    EXEC ValidateColumnData @TableName = 'UserPermissions', @JsonValues = @JsonValidation;

    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = @TableName)
    BEGIN
        ;THROW 50002, 'Validation Error: Table does not exist.', 1;
    END

    SELECT CanView, CanAdd, CanEdit, CanDelete
    FROM UserPermissions
    WHERE TableName = @TableName 
      AND UserName = @UserName;
END
GO