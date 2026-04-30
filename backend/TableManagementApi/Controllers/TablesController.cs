using Microsoft.AspNetCore.Mvc;
using TableManagementBl.BusinessObjects;
using TableManagementContracts;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;

namespace TableManagementApi.Controllers
{
    [ApiController]
    [Route("api/tables")]
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
                var tableDtos = await _tablesBo.GetAllTables();
                return Ok(tableDtos);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
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
                return NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "קרתה שגיאה בחיפוש הנתונים", details = ex.Message });
            }
        }

        [HttpPost("update")]
        public async Task<IActionResult> UpdateRecord([FromBody] UpdateRecordRequestDto request)
        {
            if (request == null)
            {
                return BadRequest(new { message = "נתוני בקשה ריקים" });
            }

            try
            {
                await _tablesBo.UpdateTableRecord(request);
                return Ok(new { message = "הרשומה עודכנה בהצלחה" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "שגיאת מערכת בעדכון הרשומה", details = ex.Message });
            }
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddRecord([FromBody] AddRecordRequestDto request)
        {
            if (request == null || string.IsNullOrEmpty(request.TableName) || request.RecordData == null)
            {
                return BadRequest(new { message = "נתוני בקשה חסרים או לא תקינים" });
            }

            try
            {
                await _tablesBo.AddTableRecord(request.TableName, request.RecordData, request.UpdateUser);
                return Ok(new { message = "הרשומה נוספה בהצלחה למערכת" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "שגיאה פנימית בהוספת רשומה", details = ex.Message });
            }
        }

        [HttpDelete("delete")]
        public async Task<IActionResult> DeleteRecord([FromQuery] string tableName, [FromQuery] string id)
        {
            if (string.IsNullOrEmpty(tableName) || string.IsNullOrEmpty(id))
            {
                return BadRequest(new { message = "שם טבלה ומזהה רשומה הם שדות חובה" });
            }

            try
            {
                await _tablesBo.DeleteTableRecord(tableName, id);
                return Ok(new { message = "הרשומה נמחקה בהצלחה מהמערכת" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}