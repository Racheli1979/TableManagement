import { Component, OnInit } from '@angular/core';
import { TablesService } from 'src/app/services/tables.service';

@Component({
  selector: 'app-tables',
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.scss']
})
export class TablesComponent implements OnInit {
  tables: any[] = [];           // רשימת הטבלאות מה-Sidebar
  selectedTable: any = null;    // הטבלה שנבחרה כרגע
  tableData: any[] = [];        // הנתונים שמוצגים ב-Grid
  globalSearchTerm: string = '';

  constructor(private tablesService: TablesService) { }

  ngOnInit(): void {
    this.loadTables();
  }

  loadTables() {
    this.tablesService.getTables().subscribe(data => {
      this.tables = data;
    });
  }

  selectTable(table: any) {
    this.selectedTable = table;
    this.globalSearchTerm = '';
    this.onSearch('', null); // טעינת כל הנתונים של הטבלה בבחירה
  }

  // פונקציה אחת שמשרתת גם את החיפוש הגלובלי וגם את העמודות
  onSearch(value: string, columnName: string | null) {
    if (!this.selectedTable) return;

    this.tablesService.search(this.selectedTable.TableName, value, columnName)
      .subscribe(res => {
        this.tableData = res;
      });
  }

  currentView: 'tables' | 'audit' = 'tables';

  openAddModal() {
    console.log("Opening Add Modal...");
    // כאן תבוא הקריאה לקומפוננטת המודל שיצרת
  }

  openEditModal(row: any) {
    console.log("Editing row:", row);
    // העברת השורה שנבחרה למודל
  }

  deleteRow(row: any) {
    if (confirm('האם את בטוחה שברצונך למחוק רשומה זו?')) {
      console.log("Deleting...", row);
      // קריאה ל-Service למחיקה
    }
  }
}