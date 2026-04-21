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
            try
            {
                List<TableMetadataDto> tableDtos = await _tablesBo.GetAllTables();
                return Ok(tableDtos);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "שגיאה בשליפת מבנה הנתונים", details = ex.Message });
            }
        } 

        [HttpPost("search")]
        public async Task<IActionResult> Search([FromBody] TableSearchRequestDto request)
        {
            try 
            {
                var results = await _tablesBo.SearchInTable(request);
                return Ok(results); 
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message); 
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message); 
            }
            catch (Exception ex)
            {
                return StatusCode(500, "קרתה שגיאה בשרת: " + ex.Message);
            }
        }    
    }
}
