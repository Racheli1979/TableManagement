using Microsoft.AspNetCore.Mvc;
using TableManagementBl.BusinessObjects;
using TableManagementContracts;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TableManagementApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TablesController : ControllerBase
    {
        private readonly TablesBo _tablesBo;

        public TablesController(TablesBo tablesBo)
        {
            _tablesBo = tablesBo;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllTables()
        {
            List<TableMetadataDto> tableDtos = await _tablesBo.GetAllTablesWithColumnsAsync();
            return Ok(tableDtos);
        }

        [HttpGet("search")]
        public async Task<IActionResult> GlobalSearch([FromQuery] string term)
        {
            var results = await _tablesBo.GlobalSearch(term);
            return Ok(results);
        }
    }
}
