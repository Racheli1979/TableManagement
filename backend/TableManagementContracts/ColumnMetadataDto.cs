namespace TableManagementContracts
{
    public class ColumnMetadataDto
    {
        public string ColumnName { get; set; }
        public string DataType { get; set; }
        public string IsNullable { get; set; }
        public int? MaxLength { get; set; }
    }
}  