import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { Table, Column, TablePermissions } from '../../services/tables.service';

@Component({
  selector: 'app-tables-grid',
  templateUrl: './tables-grid.component.html', 
  styleUrls: ['./tables-grid.component.scss']
})
export class TableGridComponent implements OnChanges {
  @Input() table: Table | null = null;
  @Input() permissions: TablePermissions = { canView: false, canAdd: false, canEdit: false, canDelete: false };

  @Output() rowAction = new EventEmitter<{ type: 'EDIT' | 'DELETE'; data: any }>();

  visibleColumns: Column[] = [];
  globalSearch: string = '';
  columnFilters: { [key: string]: string } = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['table'] && this.table) {
      this.setupColumns();
      this.globalSearch = '';
      this.columnFilters = {};
    }
  }

  private setupColumns(): void {
    if (!this.table) return;
    const auditFields = ['CREATE_USER', 'CREATE_DATE', 'UPDATE_USER', 'UPDATE_DATE'];
    this.visibleColumns = [...this.table.columns].sort((a, b) => {
      const isAAudit = auditFields.includes(a.columnName.toUpperCase());
      const isBAudit = auditFields.includes(b.columnName.toUpperCase());
      return (isAAudit ? 1 : 0) - (isBAudit ? 1 : 0);
    });
  }

  getFilteredRows(): any[] {
    if (!this.table || !this.table.rowData) return [];
    let rows = this.table.rowData;

    if (this.globalSearch) {
      const search = this.globalSearch.toLowerCase().trim();
      rows = rows.filter((row) =>
        this.table!.columns.some((col) => {
          const val = (row[col.columnName]?.toString() || '').toLowerCase();
          const displayVal = (row[col.columnName + '_Display']?.toString() || '').toLowerCase();
          return val.includes(search) || displayVal.includes(search);
        })
      );
    }

    Object.keys(this.columnFilters).forEach((colName) => {
      const filterValue = this.columnFilters[colName]?.toLowerCase().trim();
      if (filterValue) {
        rows = rows.filter((row) => {
          const val = (row[colName]?.toString() || '').toLowerCase();
          const displayVal = (row[colName + '_Display']?.toString() || '').toLowerCase();
          return val.includes(filterValue) || displayVal.includes(filterValue);
        });
      }
    });

    return rows;
  }

  onEdit(row: any): void {
    this.rowAction.emit({ type: 'EDIT', data: row });
  }

  onDelete(row: any): void {
    this.rowAction.emit({ type: 'DELETE', data: row });
  }
}