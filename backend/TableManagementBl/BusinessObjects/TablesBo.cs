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

        public TablesBo(tablesDo tablesDo)
        {
            _tablesDo = tablesDo;
        }

        public async Task<List<TableMetadataDto>> GetAllTablesAsync()
        {
            var rows = await _tablesDo.GetAllTablesAsync();

            var tableDtos = rows
                .Select(r => new TableMetadataDto
                {
                    TableName = r.TableName ?? "",
                    SchemaName = r.SchemaName ?? "",
                    ObjectType = r.ObjectType ?? ""
                })
                .ToList();

            return tableDtos;
        }
    }
}
