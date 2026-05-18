GO
CREATE PROCEDURE GetTablePermissions
    @TableName NVARCHAR(128),
    @UserName NVARCHAR(128)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @UpperTable NVARCHAR(128) = UPPER(@TableName);

    EXEC ValidateColumnData @TableName = @TableName, @ColumnName = 'TableName', @Value = @TableName;
    EXEC ValidateColumnData @TableName = @TableName, @ColumnName = 'UserName', @Value = @UserName;

    IF NOT EXISTS (
        SELECT 1 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE UPPER(TABLE_NAME) = @UpperTable
    )
    BEGIN
        RAISERROR ('Table does not exist.', 16, 1);
        RETURN;
    END

    SELECT CanView, CanAdd, CanEdit, CanDelete
    FROM UserPermissions
    WHERE UPPER(TableName) = @UpperTable AND UPPER(UserName) = UPPER(@UserName);
END;
GO