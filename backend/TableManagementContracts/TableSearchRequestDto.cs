namespace TableManagementContracts
{
    public class TableSearchRequestDto
    {
        public string TableName { get; set; } = string.Empty;
        public string? ColumnName { get; set; } 
        public string? SearchValue { get; set; } 
    }
}