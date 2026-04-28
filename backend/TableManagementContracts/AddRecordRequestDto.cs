namespace TableManagementContracts
{
    public class AddRecordRequestDto
    {
        public string TableName { get; set; }
        public Dictionary<string, object> RecordData { get; set; }
        public string UpdateUser { get; set; }
    }
}