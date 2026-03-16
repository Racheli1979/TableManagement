CREATE PROCEDURE GetAllUserTables
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        t.name AS TableName,
        s.name AS SchemaName,
        'TABLE' AS ObjectType
    FROM sys.tables t
    INNER JOIN sys.schemas s
        ON t.schema_id = s.schema_id
    WHERE t.is_ms_shipped = 0         
      AND t.name NOT LIKE 'sys%'       
    ORDER BY s.name, t.name;
END
GO