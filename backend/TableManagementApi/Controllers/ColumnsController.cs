using Microsoft.AspNetCore.Mvc;
using TableManagementBl.BusinessObjects;
using TableManagementContracts;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TableManagementApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ColumnsController : ControllerBase
    {
        private readonly ColumnsBo _columnsBo;

        public ColumnsController(ColumnsBo columnsBo)
        {
            _columnsBo = columnsBo;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllColumns()
        {
            var tablesWithColumns = await _columnsBo.GetAllColumnsGroupedByTableAsync();
            return Ok(tablesWithColumns);
        }
    }
}
