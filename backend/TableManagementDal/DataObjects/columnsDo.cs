using Dapper;
using System.Collections.Generic;
using System.Data;
using Microsoft.Data.SqlClient;
using System.Threading.Tasks;

namespace TableManagementDal.DataObjects
{
    public class columnsDo
    {
        private readonly string _connectionString;

        public columnsDo(string connectionString)
        {
            _connectionString = connectionString;
        }

        public async Task<IEnumerable<dynamic>> GetAllColumnsAsync()
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            return await connection.QueryAsync<dynamic>(
                "GetColumnsForTable",
                commandType: CommandType.StoredProcedure
            );
        }
    }
}
