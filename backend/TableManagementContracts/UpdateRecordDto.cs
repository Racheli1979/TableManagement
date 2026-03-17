namespace TableManagementContracts
{
    public class UpdateRecordDto
    {
        public string TableName { get; set; }
        public Dictionary<string, object> RowData { get; set; }
    }
}
