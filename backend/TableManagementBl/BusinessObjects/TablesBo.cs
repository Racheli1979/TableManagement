using TableManagementDal.DataObjects;
using TableManagementContracts;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;
using Microsoft.Data.SqlClient;
using System.Text.Json;

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

                return rawData
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

        public async Task UpdateTableRecord(UpdateRecordRequestDto request)
        {
            if (request == null || string.IsNullOrEmpty(request.TableName))
                throw new ArgumentException("נתוני עדכון חסרים.");

            var allMetadata = await GetAllTables();
            var table = allMetadata.FirstOrDefault(t => t.TableName.Equals(request.TableName, StringComparison.OrdinalIgnoreCase));
            if (table == null) throw new KeyNotFoundException("הטבלה לא קיימת.");

            var column = table.Columns.FirstOrDefault(c => c["ColumnName"].ToString().Equals(request.ColumnName, StringComparison.OrdinalIgnoreCase));
            if (column == null) throw new KeyNotFoundException("העמודה לא קיימת.");

            ValidateFieldValue(request.ColumnName, request.NewValue, column["DataType"].ToString());

            int rowsAffected = await _tablesDo.UpdateRecord(request);

            if (rowsAffected == 0)
            {
                throw new KeyNotFoundException($"העדכון נכשל: לא נמצאה רשומה עם מזהה '{request.IdValue}' בטבלת {request.TableName}.");
            }
        }

        public async Task AddTableRecord(string tableName, Dictionary<string, object> record, string user)
        {
            if (string.IsNullOrEmpty(tableName) || record == null || !record.Any())
                throw new ArgumentException("נתוני הוספה חסרים.");

            var allMetadata = await GetAllTables();
            var table = allMetadata.FirstOrDefault(t => t.TableName.Equals(tableName, StringComparison.OrdinalIgnoreCase));
            
            if (table == null) 
                throw new KeyNotFoundException($"הטבלה '{tableName}' לא קיימת.");

            foreach (var kvp in record)
            {
                var columnMetadata = table.Columns.FirstOrDefault(c => 
                    c["ColumnName"]?.ToString()?.Equals(kvp.Key, StringComparison.OrdinalIgnoreCase) == true);
                
                if (columnMetadata != null)
                {
                    string dataType = columnMetadata["DataType"]?.ToString() ?? "NVARCHAR";
                    ValidateFieldValue(kvp.Key, kvp.Value, dataType);
                }
            }

            try
            {
                var jsonData = JsonSerializer.Serialize(record);
                await _tablesDo.AddTableRecord(tableName, jsonData, user ?? "SystemUser");
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("Validation Error") || ex.Message.Contains("Security Violation"))
                {
                    throw new ArgumentException(ex.Message);
                }
                throw new Exception("שגיאה בתהליך שמירת הרשומה: " + ex.Message);
            }
        }

        private void ValidateFieldValue(string columnName, object rawValue, string dataType)
        {
            string value = rawValue?.ToString() ?? "";
            string upperValue = value.ToUpper().Trim();

            string[] forbidden = { "DROP", "DELETE", "UPDATE", "SELECT", "TRUNCATE", "--" };
            if (forbidden.Any(word => upperValue.Contains(word)))
            {
                throw new UnauthorizedAccessException($"אבטחה: ערך אסור זוהה בשדה '{columnName}'.");
            }

            string colLower = columnName.ToLower();
            if (new[] { "name", "city", "country", "desc" }.Any(t => colLower.Contains(t)) && !string.IsNullOrEmpty(value))
            {
                if (!System.Text.RegularExpressions.Regex.IsMatch(value, @"^[a-zA-Zא-ת\s'-]+$"))
                    throw new ArgumentException($"בשדה '{columnName}' מותר להזין אותיות בלבד.");
            }

            if (new[] { "INT", "DECIMAL", "FLOAT", "NUMBER" }.Any(t => dataType.ToUpper().Contains(t)) && !string.IsNullOrEmpty(value))
            {
                if (!double.TryParse(value, out _))
                    throw new ArgumentException($"בשדה '{columnName}' חובה להזין מספר תקין.");
            }
        }
    }
}