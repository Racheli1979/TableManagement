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

        public async Task<IEnumerable<dynamic>> GetAllTablesAsync()
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            return await connection.QueryAsync<dynamic>(
                "GetAllUserTables",
                commandType: CommandType.StoredProcedure
            );
        }

        public async Task<List<SearchResultDto>> GlobalSearch(string searchTerm)
        {
            await using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var jsonChunks = await connection.QueryAsync<string>(
                "GlobalSearchAllTables",
                new { SearchTerm = searchTerm },
                commandType: CommandType.StoredProcedure
            );

            var fullJson = string.Concat(jsonChunks);

            if (string.IsNullOrWhiteSpace(fullJson))
                return new List<SearchResultDto>();

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true, 
                NumberHandling = JsonNumberHandling.AllowReadingFromString
            };

            try 
            {
                return JsonSerializer.Deserialize<List<SearchResultDto>>(fullJson, options) 
                    ?? new List<SearchResultDto>();
            }
            catch (JsonException ex)
            {
                throw new Exception($"Parsing failed. Content length: {fullJson.Length}", ex);
            }
        }
        
        public async Task<IEnumerable<dynamic>> ColumnSearch(
            string tableName,
            List<string> columns,
            string searchValue)
        {
            using var connection = new SqlConnection(_connectionString);

            string columnsCsv = string.Join(",", columns);

            var parameters = new DynamicParameters();
            parameters.Add("@TableName", tableName, DbType.String);
            parameters.Add("@Columns", columnsCsv, DbType.String);
            parameters.Add("@SearchValue", searchValue, DbType.String);

            var result = await connection.QueryAsync(
                "SearchTableColumns",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return result;
        }
    }
}