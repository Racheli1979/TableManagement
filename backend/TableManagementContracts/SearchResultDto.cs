namespace TableManagementContracts
{
    public class SearchResultDto
    {
    
        public string TableName { get; set; } = string.Empty;
        public List<Dictionary<string, object>> RowData { get; set; } = new();
        public List<ColumnDto> Columns { get; set; } = new();
    }

    public class ColumnDto
    {
        public string ColumnName { get; set; } = string.Empty;
        public string DataType { get; set; } = string.Empty;
    }
}