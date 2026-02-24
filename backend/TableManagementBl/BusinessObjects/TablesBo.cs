using TableManagementDal.DataObjects;
using TableManagementContracts;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.RegularExpressions;

namespace TableManagementBl.BusinessObjects
{
    public class TablesBo
    {
        private readonly tablesDo _tablesDo;
        private readonly columnsDo _columnsDo;

        public TablesBo(tablesDo tablesDo, columnsDo columnsDo)
        {
            _tablesDo = tablesDo;
            _columnsDo = columnsDo;
        }

        public async Task<List<TableMetadataDto>> GetAllTablesWithColumnsAsync()
        {
            var tables = (await _tablesDo.GetAllTablesAsync()).ToList();

            var columns = (await _columnsDo.GetAllColumnsAsync()).ToList();

            var tableDtos = tables
                .Select(t => new TableMetadataDto
                {
                    TableName = t.TableName ?? "",
                    SchemaName = t.SchemaName ?? "",
                    ObjectType = t.ObjectType ?? "",
                    Columns = columns
                        .Where(c => c.TableName == t.TableName && c.SchemaName == t.SchemaName)
                        .Select(c => new Dictionary<string, object>
                        {
                            { "ColumnName", c.ColumnName },
                            { "DataType", c.DataType },
                            { "IsNullable", c.IsNullable },
                            { "MaxLength", c.MaxLength }
                        })
                        .ToList()
                })
                .ToList();

            return tableDtos;
        }

        public async Task<List<SearchResultDto>> GlobalSearch(string term)
        {
            if (string.IsNullOrWhiteSpace(term))
                return new List<SearchResultDto>();

            return await _tablesDo.GlobalSearch(term);
        }

        public async Task<IEnumerable<dynamic>> ColumnSearch(string tableName, List<string> columns, string searchValue)
        {
            if (string.IsNullOrWhiteSpace(tableName))
                throw new ArgumentException("Table name is required");

            if (columns == null || columns.Count == 0)
                throw new ArgumentException("At least one column is required");

            if (string.IsNullOrWhiteSpace(searchValue))
                throw new ArgumentException("Search value is required");

            if (searchValue.Length > 100)
                throw new ArgumentException("Search value too long");

            if (!Regex.IsMatch(tableName, @"^[a-zA-Z0-9_]+$"))
                throw new ArgumentException($"Invalid table name: {tableName}");

            foreach (var col in columns)
            {
                if (!Regex.IsMatch(col, @"^[a-zA-Z0-9_]+$"))
                    throw new ArgumentException($"Invalid column name: {col}");
            }

            return await _tablesDo.ColumnSearch(tableName, columns, searchValue);
        }
    }
}
