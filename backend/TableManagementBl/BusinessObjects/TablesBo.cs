using TableManagementDal.DataObjects;
using TableManagementContracts;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;
using Microsoft.Data.SqlClient;

namespace TableManagementBl.BusinessObjects
{
    public class TablesBo
    {
        private readonly tablesDo _tablesDo;

        public TablesBo(tablesDo tablesDo)
        {
            _tablesDo = tablesDo;
        }

        public async Task<List<TableMetadataDto>> GetAllTables()
        {
            try
            {
                var rawData = (await _tablesDo.GetAllTables())?.ToList();

                if (rawData == null || !rawData.Any())
                {
                    throw new InvalidOperationException("לא נמצאו טבלאות או עמודות בבסיס הנתונים.");
                }

                var tableDtos = rawData
                    .GroupBy(r => new { 
                        TableName = r.TableName ?? "Unknown", 
                        SchemaName = r.SchemaName ?? "Unknown", 
                        ObjectType = r.ObjectType ?? "Unknown" 
                    })
                    .Select(g => new TableMetadataDto
                    {
                        TableName = g.Key.TableName,
                        SchemaName = g.Key.SchemaName,
                        ObjectType = g.Key.ObjectType,
                        Columns = g.Select(c => new Dictionary<string, object>
                        {
                            { "ColumnName", c.ColumnName ?? "Unknown" },
                            { "DataType", c.DataType ?? "Unknown" },
                            { "IsNullable", c.IsNullable },
                            { "MaxLength", c.MaxLength },
                            { "IsForeignKey", c.IsForeignKey },
                            { "RelatedTable", c.RelatedTable ?? "" }
                        }).ToList()
                    })
                    .ToList();

                return tableDtos;
            }
            catch (SqlException ex)
            {
                throw new Exception("שגיאה בשליפת מבנה הטבלאות מה-DB. וודא שהפרוצדורה קיימת.", ex);
            }
            catch (Exception ex)
            {
                throw new Exception("קרתה שגיאה בתהליך עיבוד נתוני הטבלאות.", ex);
            }
        }

        public async Task<IEnumerable<dynamic>> SearchInTable(TableSearchRequestDto request)
        {
            if (request == null || string.IsNullOrEmpty(request.TableName))
                throw new ArgumentException("חובה לציין שם טבלה.");

            var allTables = await GetAllTables();
            var table = allTables.FirstOrDefault(t => t.TableName.Equals(request.TableName, StringComparison.OrdinalIgnoreCase));
            
            if (table == null)
                throw new KeyNotFoundException($"הטבלה '{request.TableName}' לא קיימת.");

            if (!string.IsNullOrEmpty(request.ColumnName))
            {
                var column = table.Columns.FirstOrDefault(c => 
                    c.ContainsKey("ColumnName") && 
                    c["ColumnName"]?.ToString()?.Equals(request.ColumnName, StringComparison.OrdinalIgnoreCase) == true);
                
                if (column == null)
                    throw new KeyNotFoundException($"העמודה '{request.ColumnName}' לא קיימת בטבלה '{request.TableName}'.");

                if (!string.IsNullOrEmpty(request.SearchValue))
                {
                    var dataType = column.ContainsKey("DataType") ? column["DataType"]?.ToString()?.ToUpper() : "";
                    if (dataType == "NUMBER" || dataType == "INT" || dataType == "DECIMAL")
                    {
                        if (!double.TryParse(request.SearchValue, out _))
                            throw new ArgumentException($"העמודה '{request.ColumnName}' היא נומרית, אך ערך החיפוש אינו מספר תקין.");
                    }
                }
            }

            return await _tablesDo.SearchTable(request);
        }
    }
}