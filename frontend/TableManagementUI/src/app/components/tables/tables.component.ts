import { Component, OnInit, OnDestroy } from '@angular/core';
import { TablesService, Table, Column } from '../../services/tables.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-tables',
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.scss']
})
export class TablesComponent implements OnInit, OnDestroy {
  allTables: Table[] = [];
  filteredTables: Table[] = [];
  searchTermTable: string = '';

  showAuditLog: boolean = false;
  auditData: any[] = [];

  selectedTableForColumnSearch: Table | null = null;
  selectedRecord: any = null;
  selectedTableForEdit: Table | null = null;

  private tableSearchSubject = new Subject<string>();
  private subscriptions: Subscription[] = [];

  // globalSearch: string = '';
  // columnFilters: { [key: string]: string } = {};
  globalSearch: string = '';
  columnFilters: { [key: string]: string } = {};

  constructor(private tablesService: TablesService) { }

  ngOnInit(): void {
    this.loadInitialData();

    this.subscriptions.push(
      this.tableSearchSubject.pipe(
        debounceTime(200),
        distinctUntilChanged()
      ).subscribe(term => {

        // 👉 אם החיפוש ריק - חזרה למצב התחלתי
        if (!term || term.trim() === '') {
          this.filteredTables = [...this.allTables];
          this.selectedTableForColumnSearch = null;
          this.showAuditLog = false;

          // 👉 ניקוי נתוני טבלאות
          this.allTables.forEach(t => t.rowData = undefined);

          return;
        }

        const filtered = this.allTables.filter(t =>
          t.tableName.toLowerCase().includes(term.toLowerCase())
        );

        this.filteredTables = filtered;

        if (filtered.length === 1) {
          this.toggleTable(filtered[0]);
        }
      })
    );
  }

  loadInitialData() {
    this.tablesService.getTables().subscribe({
      next: (data: any[]) => {
        this.allTables = data.map(t => ({
          tableName: t.tableName || t.TableName,
          schemaName: t.schemaName || t.SchemaName || 'dbo',
          objectType: t.objectType || t.ObjectType || 'BASE TABLE',
          columns: (t.columns || t.Columns || []).map((c: any) => ({
            columnName: c.columnName || c.ColumnName,
            dataType: c.dataType || c.DataType,
            isNullable: c.isNullable || c.IsNullable,
            maxLength: c.maxLength || c.MaxLength
          }))
        }));
        this.filteredTables = [...this.allTables];
        console.log(this.filteredTables, data);

      },
      error: (err) => console.error('Error fetching tables:', err)
    });
  }

  onTableSearchInput() {
    this.tableSearchSubject.next(this.searchTermTable);
  }

  toggleTable(table: Table): void {
    this.showAuditLog = false;
    this.selectedTableForColumnSearch = table;

    const request = {
      TableName: table.tableName,
      ColumnName: null,
      SearchValue: null
    };

    this.tablesService.searchInTable(request)
      .subscribe({
        next: (data: any) => {
          table.rowData = data;
        },
        error: (err) => console.error(err)
      });
  }

  openAudit() {
    this.showAuditLog = true;
    this.selectedTableForColumnSearch = null;
    this.tablesService.getAuditLog().subscribe(data => {
      this.auditData = data;
    });
  }

  openAddModal() {
    if (!this.selectedTableForColumnSearch) return;
    this.selectedRecord = {};
    this.selectedTableForEdit = this.selectedTableForColumnSearch;
  }

  handleSave(data: any) {
    console.log('Data to save:', data);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  // getFilteredRows(): any[] {
  //   let rows = this.selectedTableForColumnSearch?.rowData || [];

  //   // חיפוש גלובלי
  //   if (this.globalSearch) {
  //     const search = this.globalSearch.toLowerCase();

  //     rows = rows.filter(row =>
  //       this.selectedTableForColumnSearch!.columns.some(col => {
  //         const value = row[col.columnName];
  //         return value?.toString().toLowerCase().includes(search);
  //       })
  //     );
  //   }

  //   // חיפוש לפי עמודות
  //   rows = rows.filter(row => {
  //     return Object.keys(this.columnFilters).every(key => {
  //       const filterValue = this.columnFilters[key];
  //       if (!filterValue) return true;

  //       const cellValue = row[key];
  //       return cellValue?.toString().toLowerCase()
  //         .includes(filterValue.toLowerCase());
  //     });
  //   });

  //   return rows;
  // }
  getFilteredRows(): any[] {
    let rows = this.selectedTableForColumnSearch?.rowData || [];

    // חיפוש גלובלי
    if (this.globalSearch) {
      const search = this.globalSearch.toLowerCase();

      rows = rows.filter(row =>
        this.selectedTableForColumnSearch!.columns.some(col => {
          const value = row[col.columnName];
          return value?.toString().toLowerCase().includes(search);
        })
      );
    }

    // חיפוש לפי עמודות
    rows = rows.filter(row => {
      return Object.keys(this.columnFilters).every(key => {
        const filterValue = this.columnFilters[key];
        if (!filterValue) return true;

        const cellValue = row[key];
        return cellValue?.toString().toLowerCase()
          .includes(filterValue.toLowerCase());
      });
    });

    return rows;
  }
}