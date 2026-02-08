using Microsoft.Data.SqlClient;
using System.Collections.Generic;
using System.Dynamic;
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
            var tables = new List<dynamic>();

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();

                using (SqlCommand command = new SqlCommand("GetAllUserTables", connection))
                {
                    command.CommandType = System.Data.CommandType.StoredProcedure;

                    using SqlDataReader reader = await command.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        dynamic table = new ExpandoObject();
                        table.TableName = reader["TableName"].ToString();
                        table.SchemaName = reader["SchemaName"].ToString();
                        table.ObjectType = reader["ObjectType"].ToString();

                        tables.Add(table);
                    }
                }
            }

            return tables;
        }
    }
}
