namespace TableManagementContracts
{
    public class TableMetadataDto
    {
        public string TableName { get; set; }
        public string SchemaName { get; set; }
        public string ObjectType { get; set; }
        public List<ColumnMetadataDto> Columns { get; set; } = new List<ColumnMetadataDto>();
    }
}
