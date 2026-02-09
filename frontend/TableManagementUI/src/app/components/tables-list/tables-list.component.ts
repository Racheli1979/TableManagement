import { Component, OnInit } from '@angular/core';
import { TablesService, Table } from 'src/app/services/tables.service';

@Component({
  selector: 'app-tables-list',
  templateUrl: './tables-list.component.html',
  styleUrls: ['./tables-list.component.scss']
})
export class TablesListComponent implements OnInit {
  tables: Table[] = [];
  filteredTables: Table[] = [];
  searchTerm: string = '';

  constructor(private tablesService: TablesService) { }

  ngOnInit(): void {
    this.loadTables();
  }

  loadTables(): void {
    this.tablesService.getTables().subscribe({
      next: (data: Table[]) => {
        this.tables = data;
        this.filteredTables = data;
      },
      error: (err: any) => console.error(err)
    });
  }

  toggleExpand(table: Table): void {
    table.expanded = !table.expanded;
  }

  filterTables(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredTables = this.tables.filter(t =>
      t.tableName.toLowerCase().includes(term) ||
      t.schemaName.toLowerCase().includes(term)
    );
  }
}