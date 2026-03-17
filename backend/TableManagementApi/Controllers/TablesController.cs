using Microsoft.AspNetCore.Mvc;
using TableManagementBl.BusinessObjects;
using TableManagementContracts;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;

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
            List<TableMetadataDto> tableDtos = await _tablesBo.GetAllTables();
            return Ok(tableDtos);
        }

        [HttpPost("search")]
        public async Task<IActionResult> Search([FromBody] TableSearchRequestDto request)
        {
            var results = await _tablesBo.SearchInTable(request);
            return Ok(results);
        }        
    }
}
