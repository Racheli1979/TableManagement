import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Column {
  ColumnName: string;
  DataType: string;
  IsNullable: string;
  MaxLength: number | null;
}

interface Table {
  tableName: string;
  schemaName: string;
  objectType: string;
  columns: Column[];
  expanded?: boolean; 
}

@Component({
  selector: 'app-tables-list',
  templateUrl: './tables-list.component.html',
  styleUrls: ['./tables-list.component.scss']
})
export class TablesListComponent implements OnInit {
  tables: Table[] = [];
  filteredTables: Table[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchTables();
  }

  fetchTables(): void {
    this.http.get<Table[]>('http://localhost:5081/api/tables')
      .subscribe({
        next: (data) => {
          this.tables = data;
          this.filteredTables = data;
        },
        error: (err) => console.error(err)
      });
  }

  toggleExpand(table: Table): void {
    table.expanded = !table.expanded;
  }
}