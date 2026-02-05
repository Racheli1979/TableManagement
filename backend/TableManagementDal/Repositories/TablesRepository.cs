using Microsoft.Data.SqlClient;
using TableManagementDal.Models;
using System.Collections.Generic;

namespace TableManagementDal.Repositories
{
    public class TablesRepository
    {
        private readonly string _connectionString;

        public TablesRepository(string connectionString)
        {
            _connectionString = connectionString;
        }

        public List<TableMetadataDo> GetAllTables()
        {
            List<TableMetadataDo> tables = new List<TableMetadataDo>();

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                SqlCommand command = new SqlCommand(
                    @"SELECT TABLE_NAME AS TableName, TABLE_SCHEMA AS SchemaName, 'TABLE' AS ObjectType
                    FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_TYPE = 'BASE TABLE'
                        AND TABLE_NAME NOT LIKE 'sys%'
                        AND TABLE_NAME NOT LIKE 'INFORMATION_SCHEMA%'",
                    connection
                );

                using SqlDataReader reader = command.ExecuteReader();
                while (reader.Read())
                {
                    TableMetadataDo tableDo = new TableMetadataDo
                    {
                        TableName = reader["TableName"].ToString(),
                        SchemaName = reader["SchemaName"].ToString(),
                        ObjectType = reader["ObjectType"].ToString()
                    };
                    tables.Add(tableDo);
                }
            }

            return tables;
        }
    }
}
