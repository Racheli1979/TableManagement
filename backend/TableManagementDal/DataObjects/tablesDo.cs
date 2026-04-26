using Dapper;
using System.Collections.Generic;
using System.Data;
using Microsoft.Data.SqlClient;
using System.Threading.Tasks;
using TableManagementContracts;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace TableManagementDal.DataObjects
{
    public class tablesDo
    {
        private readonly string _connectionString;

        public tablesDo(string connectionString)
        {
            _connectionString = connectionString;
        }

        public async Task<IEnumerable<dynamic>> GetAllTables()
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            return await connection.QueryAsync<dynamic>(
                "GetAllUserTables",
                commandType: CommandType.StoredProcedure
            );
        }

        public async Task<IEnumerable<dynamic>> SearchTable(TableSearchRequestDto request)
        {
            using var connection = new SqlConnection(_connectionString);
            
            var parameters = new DynamicParameters();
            parameters.Add("@TableName", request.TableName);
            
            string? colName = (string.IsNullOrWhiteSpace(request.ColumnName) || request.ColumnName == "string") 
                            ? null : request.ColumnName;
                            
            parameters.Add("@ColumnName", colName);
            parameters.Add("@SearchValue", request.SearchValue);

            return await connection.QueryAsync<dynamic>(
                "SearchTableData", 
                parameters, 
                commandType: CommandType.StoredProcedure
            );
        }

        public async Task<int> UpdateRecord(UpdateRecordRequestDto request)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                using (var command = new SqlCommand("UpdateRecord", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.AddWithValue("@TableName", request.TableName);
                    command.Parameters.AddWithValue("@ColumnName", request.ColumnName);
                    command.Parameters.AddWithValue("@NewValue", request.NewValue ?? (object)DBNull.Value);
                    command.Parameters.AddWithValue("@IdValue", request.IdValue);
                    command.Parameters.AddWithValue("@UpdateUser", request.UpdateUser);

                    await connection.OpenAsync();
                    int rowsAffected = await command.ExecuteNonQueryAsync();
                    return rowsAffected;
                }
            }
        }
    }
}