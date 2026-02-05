using Microsoft.AspNetCore.Mvc;
using TableManagementBl.Services;
using TableManagementBl.Models;
using TableManagementContracts;
using System.Collections.Generic;
using System.Linq;

namespace TableManagementApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TablesController : ControllerBase
    {
        private readonly TablesService _service;

        public TablesController(TablesService service)
        {
            _service = service;
        }

        [HttpGet]
        public List<TableMetadataDto> GetAllTables()
        {
            List<TableMetadataBo> tableBos = _service.GetAllTables();
            List<TableMetadataDto> tableDtos = tableBos.Select(b => new TableMetadataDto
            {
                TableName = b.TableName,
                SchemaName = b.SchemaName,
                ObjectType = b.ObjectType
            }).ToList();

            return tableDtos;
        }
    }
}
