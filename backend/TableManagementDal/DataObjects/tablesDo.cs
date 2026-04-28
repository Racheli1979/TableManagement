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

        public async Task<int> AddTableRecord(string tableName, string jsonData, string user)
        {
            using var connection = new SqlConnection(_connectionString);
            
            var parameters = new DynamicParameters();
            parameters.Add("@TableName", tableName);
            parameters.Add("@JsonValues", jsonData);
            parameters.Add("@UpdateUser", user);

            return await connection.ExecuteAsync(
                "AddNewRecord", 
                parameters, 
                commandType: CommandType.StoredProcedure
            );
        }

        public async Task<int> UpdateRecord(UpdateRecordRequestDto request)
        {
            using var connection = new SqlConnection(_connectionString);
            
            var parameters = new DynamicParameters();
            parameters.Add("@TableName", request.TableName);
            parameters.Add("@ColumnName", request.ColumnName);
            parameters.Add("@NewValue", request.NewValue ?? (object)DBNull.Value);
            parameters.Add("@IdValue", request.IdValue);
            parameters.Add("@UpdateUser", request.UpdateUser);

            return await connection.ExecuteAsync(
                "UpdateRecord", 
                parameters, 
                commandType: CommandType.StoredProcedure
            );
        }
    }
}