using Dapper;
using System.Collections.Generic;
using System.Data;
using Microsoft.Data.SqlClient;
using System.Threading.Tasks;

namespace TableManagementDal.DataObjects
{
    public class tablesDo
    {
        private readonly string _connectionString;

        public tablesDo(string connectionString)
        {
            _connectionString = connectionString;
        }

        public async Task<IEnumerable<dynamic>> GetAllTablesAsync()
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            return await connection.QueryAsync<dynamic>(
                "GetAllUserTables",
                commandType: CommandType.StoredProcedure
            );
        }
    }
}
