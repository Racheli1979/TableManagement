-- CREATE PROCEDURE GetAllUserTables
-- AS
-- BEGIN
--     SET NOCOUNT ON;

--     SELECT 
--         t.name AS TableName,
--         s.name AS SchemaName,
--         'TABLE' AS ObjectType
--     FROM sys.tables t
--     INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
--     WHERE t.is_ms_shipped = 0 
--       AND t.name NOT IN ('sysdiagrams', 'AuditLog', 'UserPermissions')
--     ORDER BY t.name;
-- END
-- GO


ALTER PROCEDURE GetAllUserTables
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        t.name AS TableName,
        s.name AS SchemaName,
        'TABLE' AS ObjectType,
        c.name AS ColumnName,
        ty.name AS DataType,
        CASE WHEN c.is_nullable = 1 THEN 'YES' ELSE 'NO' END AS IsNullable,
        COLUMNPROPERTY(c.object_id, c.name, 'Precision') AS MaxLength,
        -- שדות המפתח הזר החדשים
        CASE WHEN fk.referenced_object_id IS NOT NULL THEN 1 ELSE 0 END AS IsForeignKey,
        OBJECT_NAME(fk.referenced_object_id) AS RelatedTable
    FROM sys.tables t
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    INNER JOIN sys.columns c ON t.object_id = c.object_id
    INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
    -- חיבור למציאת מפתחות זרים
    LEFT JOIN sys.foreign_key_columns fkc ON t.object_id = fkc.parent_object_id AND c.column_id = fkc.parent_column_id
    LEFT JOIN sys.foreign_keys fk ON fkc.constraint_object_id = fk.object_id
    WHERE t.is_ms_shipped = 0 
      AND t.name NOT IN ('sysdiagrams', 'AuditLog', 'UserPermissions', '__EFMigrationsHistory')
      AND ty.name <> 'sysname' -- סינון טיפוסים פנימיים
    ORDER BY t.name, c.column_id;
END