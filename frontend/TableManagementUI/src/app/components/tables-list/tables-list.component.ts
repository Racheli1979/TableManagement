import { Component, OnInit } from '@angular/core';
import { TablesService, Table } from 'src/app/services/tables.service';

@Component({
  selector: 'app-tables-list',
  templateUrl: './tables-list.component.html',
  styleUrls: ['./tables-list.component.scss']
})
export class TablesListComponent implements OnInit {

  allTables: Table[] = [];
  filteredTables: Table[] = [];

  searchTermGlobal: string = '';
  searchTermTable: string = '';

  viewMode: 'initial' | 'tableSearch' | 'globalSearch' = 'initial';

  selectedTableForColumnSearch: Table | null = null;
  selectedColumnsForSearch: string[] = [];
  columnSearchValue: string = '';
  selectAllColumns: boolean = false;

  constructor(private tablesService: TablesService) {}

  ngOnInit(): void {
    this.tablesService.getTables().subscribe({
      next: (data: Table[]) => {
        this.allTables = data.map(t => ({ ...t, expanded: false }));
        this.filteredTables = this.allTables;
        this.viewMode = 'initial';
      },
      error: (err) => console.error(err)
    });
  }

  filterTables(): void {
    const term = this.searchTermTable.toLowerCase();
    if (!term) {
      this.viewMode = 'initial';
      this.filteredTables = this.allTables;
      this.selectedTableForColumnSearch = null;
      return;
    }

    this.viewMode = 'tableSearch';
    this.filteredTables = this.allTables
      .filter(t => t.tableName.toLowerCase().includes(term))
      .map(t => ({ ...t, expanded: true }));

    if (this.filteredTables.length === 1) {
      this.selectedTableForColumnSearch = this.filteredTables[0];
    }
  }

  searchGlobalInput(): void {
    if (!this.searchTermGlobal) {
      this.viewMode = 'initial';
      this.filteredTables = this.allTables;
      return;
    }

    this.viewMode = 'globalSearch';

    this.tablesService.getGlobalSearch(this.searchTermGlobal).subscribe({
      next: (data: Table[]) => {
        this.filteredTables = data
          .filter(t => t.rowData && t.rowData.length > 0)
          .map(t => ({ ...t, expanded: false }));
      },
      error: (err) => console.error(err)
    });
  }

  toggleExpand(table: Table): void {
    table.expanded = !table.expanded;
    if (table.expanded) {
      this.selectedTableForColumnSearch = table;
      this.selectedColumnsForSearch = [];
      this.columnSearchValue = '';
      this.selectAllColumns = false;
    }
  }

  toggleColumn(columnName: string, event: any): void {
    if (event.target.checked) {
      if (!this.selectedColumnsForSearch.includes(columnName)) this.selectedColumnsForSearch.push(columnName);
    } else {
      this.selectedColumnsForSearch = this.selectedColumnsForSearch.filter(c => c !== columnName);
    }

    if (this.selectedTableForColumnSearch) {
      this.selectAllColumns = this.selectedColumnsForSearch.length === this.selectedTableForColumnSearch.columns.length;
    }
  }

  toggleSelectAll(table: Table, event: any): void {
    this.selectAllColumns = event.target.checked;
    this.selectedColumnsForSearch = this.selectAllColumns ? table.columns.map(c => c.ColumnName) : [];
  }

  searchByColumns(): void {
    if (!this.selectedTableForColumnSearch || !this.selectedColumnsForSearch.length || !this.columnSearchValue?.trim()) return;

    this.tablesService.searchColumns(
      this.selectedTableForColumnSearch.tableName,
      this.selectedColumnsForSearch,
      this.columnSearchValue.trim()
    ).subscribe({
      next: (data: any[]) => {
        if (data.length) {
          const table: Table = {
            tableName: this.selectedTableForColumnSearch!.tableName,
            schemaName: this.selectedTableForColumnSearch!.schemaName || 'dbo',
            objectType: this.selectedTableForColumnSearch!.objectType || 'TABLE',
            columns: Object.keys(data[0]).map(col => ({ ColumnName: col, DataType: 'string', IsNullable: 'YES', MaxLength: 255 })),
            rowData: data,
            expanded: true
          };

          this.selectedTableForColumnSearch = table;
          this.filteredTables = [table];
          this.selectAllColumns = this.selectedColumnsForSearch.length === table.columns.length;
        } else {
          this.selectedTableForColumnSearch = null;
          this.filteredTables = [];
        }
      },
      error: (err) => console.error(err)
    });
  }

  getColumns(row: any): string[] {
    return row ? Object.keys(row) : [];
  }
}