using TableManagementDal.Models;
using TableManagementDal.Repositories;
using TableManagementBl.Models;
using System.Collections.Generic;
using System.Linq;

namespace TableManagementBl.Services
{
    public class TablesService
    {
        private readonly TablesRepository _repository;

        public TablesService(TablesRepository repository)
        {
            _repository = repository;
        }

        public List<TableMetadataBo> GetAllTables()
        {
            // קבלת כל הטבלאות מה-Repository
            List<TableMetadataDo> tableDos = _repository.GetAllTables();

            // סינון טבלאות מערכתיות (sys*, INFORMATION_SCHEMA*)
            tableDos = tableDos
                .Where(d => !d.TableName.StartsWith("sys") && !d.TableName.StartsWith("INFORMATION_SCHEMA"))
                .ToList();

            // המרת DO ל-BO
            List<TableMetadataBo> tableBos = tableDos.Select(d => new TableMetadataBo
            {
                TableName = d.TableName,
                SchemaName = d.SchemaName,
                ObjectType = d.ObjectType
            }).ToList();

            return tableBos;
        }
    }
}
