using Dapper;
using System.Collections.Generic;
using System.Data;
using Microsoft.Data.SqlClient;
using System.Threading.Tasks;
using TableManagementContracts;
using System.Text.Json;

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

            var json = await connection.QueryFirstOrDefaultAsync<string>(
                "GlobalSearchAllTables",
                new { SearchTerm = searchTerm },
                commandType: CommandType.StoredProcedure);

            if (string.IsNullOrWhiteSpace(json))
                return new List<SearchResultDto>();

            return JsonSerializer.Deserialize<List<SearchResultDto>>(
                json,
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                }) ?? new List<SearchResultDto>();
        }
    }
}