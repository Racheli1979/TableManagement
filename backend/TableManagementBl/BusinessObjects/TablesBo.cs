using TableManagementDal.DataObjects;
using TableManagementContracts;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

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
    }
}
