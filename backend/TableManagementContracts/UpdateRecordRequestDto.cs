namespace TableManagementContracts
{
    public class UpdateRecordRequestDto
    {
        public string TableName { get; set; }
        public string ColumnName { get; set; }
        public string NewValue { get; set; }
        public string IdValue { get; set; }
        public string UpdateUser { get; set; }
    }
}