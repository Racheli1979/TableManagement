namespace TableManagementContracts
{
    public class DeleteRecordRequestDto 
    {
        public string TableName { get; set; }
        public string Id { get; set; }
        public string UpdateUser { get; set; }
        public string Reason { get; set; }
    }
}