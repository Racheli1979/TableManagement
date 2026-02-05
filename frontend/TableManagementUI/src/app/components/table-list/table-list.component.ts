import { Component, OnInit } from '@angular/core';
import { TableService, TableData } from '../../services/table.service';

@Component({
  selector: 'app-table-list',
  templateUrl: './table-list.component.html',
  styleUrls: ['./table-list.component.scss']
})
export class TableListComponent implements OnInit {
  tables: TableData[] = [];

  constructor(private tableService: TableService) {}

  ngOnInit(): void {
    this.loadTables();
  }

  loadTables() {
    this.tableService.getTables().subscribe(data => {
      this.tables = data;
    });
  }
}
