using Dapper;
using System.Collections.Generic;
using System.Data;
using Microsoft.Data.SqlClient;
using System.Threading.Tasks;
using TableManagementContracts;
using System.Linq;
using System;

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

        public async Task<int> AddTableRecord(string tableName, string jsonData, string user, string reason)
        {
            using var connection = new SqlConnection(_connectionString);
            
            var parameters = new DynamicParameters();
            parameters.Add("@TableName", tableName);
            parameters.Add("@JsonValues", jsonData);
            parameters.Add("@UpdateUser", user);
            parameters.Add("@Reason", reason);

            return await connection.ExecuteAsync(
                "AddNewRecord", 
                parameters, 
                commandType: CommandType.StoredProcedure
            );
        }

        public async Task<int> UpdateRecord(UpdateRecordRequestDto request)
        {
            using var connection = new SqlConnection(_connectionString);
            
            var jsonData = System.Text.Json.JsonSerializer.Serialize(request.UpdatedData);

            var parameters = new DynamicParameters();
            parameters.Add("@TableName", request.TableName);
            parameters.Add("@NewDataJson", jsonData);
            parameters.Add("@IdValue", request.IdValue);
            parameters.Add("@UpdateUser", request.UpdateUser);
            parameters.Add("@Reason", request.Reason);

            return await connection.ExecuteAsync(
                "UpdateRecord", 
                parameters, 
                commandType: CommandType.StoredProcedure
            );
        }

        public async Task<int> DeleteRecord(string tableName, string id, string user, string reason)
        {
            using var connection = new SqlConnection(_connectionString);
            
            var parameters = new DynamicParameters();
            parameters.Add("@TableName", tableName);
            parameters.Add("@RecordId", id);
            parameters.Add("@UpdateUser", user); 
            parameters.Add("@Reason", reason);

            return await connection.ExecuteAsync(
                "DeleteRecord", 
                parameters, 
                commandType: CommandType.StoredProcedure
            );
        }
    }
}