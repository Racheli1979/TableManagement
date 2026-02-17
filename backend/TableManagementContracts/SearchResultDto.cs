namespace TableManagementContracts;

public class SearchResultDto
{
    public string TableName { get; set; }
    public List<Dictionary<string, object>> RowData { get; set; } = new();
}

// public class GlobalSearchResult
// {
//     public string tableName { get; set; }
//     public List<Dictionary<string, object>> rowData { get; set; }
// }