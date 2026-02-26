namespace TableManagementContracts
{
    public class ColumnSearchRequestDto
    {
        public string TableName { get; set; } = string.Empty;   
        public List<string> Columns { get; set; } = new List<string>(); 
        public string SearchValue { get; set; } = string.Empty;  
    }
}