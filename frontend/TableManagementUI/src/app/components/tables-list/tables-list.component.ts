import { Component, OnInit } from '@angular/core';
import { TablesService ,Table, Column } from 'src/app/services/tables.service';

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
  isGlobalSearch: boolean = false;
  isTableNameSearch: boolean = false;

  constructor(private tablesService: TablesService) { }

  ngOnInit(): void {
    this.tablesService.getTables().subscribe({
      next: (data: Table[]) => {
        this.allTables = data;
        this.filteredTables = data;
      },
      error: (err) => console.error(err)
    });
  }

  searchGlobalInput(): void {
    this.isGlobalSearch = !!this.searchTermGlobal;
    this.isTableNameSearch = false;

    if (!this.searchTermGlobal) {
      this.filteredTables = this.allTables;
      return;
    }

    this.tablesService.getGlobalSearch(this.searchTermGlobal).subscribe({
      next: (data: Table[]) => {
        this.filteredTables = data.filter(t => t.rowData && t.rowData.length > 0);
        this.filteredTables.forEach(t => t.expanded = false);
      },
      error: (err) => console.error(err)
    });
  }

  filterTables(): void {
    this.isGlobalSearch = false;
    this.isTableNameSearch = !!this.searchTermTable;

    const term = this.searchTermTable.toLowerCase();
    this.filteredTables = this.allTables
      .filter(t => t.tableName.toLowerCase().includes(term))
      .map(t => ({
        ...t,
        columns: t.columns || []
      }));
  }

  toggleExpand(table: Table): void {
    if (this.isGlobalSearch) {
      table.expanded = !table.expanded;
    }
  }

  getColumns(row: any): string[] {
    return row ? Object.keys(row) : [];
  }
}