using TableManagementDal.DataObjects;
using TableManagementContracts;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TableManagementBl.BusinessObjects
{
    public class ColumnsBo
    {
        private readonly columnsDo _columnsDo;

        public ColumnsBo(columnsDo columnsDo)
        {
            _columnsDo = columnsDo;
        }

        public async Task<List<TableMetadataDto>> GetAllColumnsGroupedByTableAsync()
        {
            var rows = await _columnsDo.GetAllColumnsAsync(); 

            var grouped = rows
                .GroupBy(r => new { r.TableName, r.SchemaName })
                .Select(g => new TableMetadataDto
                {
                    TableName = g.Key.TableName,
                    SchemaName = g.Key.SchemaName,
                    Columns = g.Select(r => new ColumnMetadataDto
                    {
                        ColumnName = r.ColumnName,
                        DataType = r.DataType,
                        IsNullable = r.IsNullable,
                        MaxLength = r.MaxLength
                    }).ToList()
                })
                .ToList();

            return grouped;
        }
    }
}
