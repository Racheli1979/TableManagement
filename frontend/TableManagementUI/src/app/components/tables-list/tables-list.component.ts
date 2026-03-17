import { Component, OnInit, OnDestroy } from '@angular/core';
import { TablesService, Table, Column } from 'src/app/services/tables.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-tables-list',
  templateUrl: './tables-list.component.html',
  styleUrls: ['./tables-list.component.scss']
})
export class TablesListComponent implements OnInit, OnDestroy {

  allTables: Table[] = [];
  filteredTables: Table[] = [];

  searchTermGlobal: string = '';
  searchTermTable: string = '';
  columnSearchValue: string = '';

  selectedRecord: any = null;
  selectedTableForEdit: Table | null = null;

  viewMode: 'initial' | 'tableSearch' | 'globalSearch' = 'initial';

  selectedTableForColumnSearch: Table | null = null;
  selectedColumnsForSearch: string[] = [];
  selectAllColumns: boolean = false;

  private globalSearchSubject = new Subject<string>();
  private tableSearchSubject = new Subject<string>();
  private columnSearchSubject = new Subject<string>();

  private subscriptions: Subscription[] = [];

  constructor(private tablesService: TablesService) { }

  ngOnInit(): void {
    this.tablesService.getTables().subscribe({
      next: (data: Table[]) => {
        this.allTables = data.map(t => ({
          ...t,
          expanded: false,
          columns: t.columns.map((c: any) => ({
            columnName: c.columnName || c.ColumnName,
            dataType: c.dataType || c.DataType,
            isNullable: c.isNullable || c.IsNullable || "true",
            maxLength: c.maxLength || c.MaxLength || 255
          }))
        }));
        this.filteredTables = this.allTables;
        this.viewMode = 'initial';
      }
    });

    this.subscriptions.push(
      this.globalSearchSubject.pipe(debounceTime(300), distinctUntilChanged())
        .subscribe(term => this.performGlobalSearch(term))
    );

    this.subscriptions.push(
      this.tableSearchSubject.pipe(debounceTime(200), distinctUntilChanged())
        .subscribe(term => this.performTableFilter(term))
    );

    this.subscriptions.push(
      this.columnSearchSubject.pipe(debounceTime(300), distinctUntilChanged())
        .subscribe(value => this.performColumnSearch(value))
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onGlobalSearchInput(term: string) { this.globalSearchSubject.next(term); }
  onTableSearchInput(term: string) { this.tableSearchSubject.next(term); }
  onColumnSearchInput(value: string) {
    if (!value || !value.trim()) {
      this.resetColumnResults();
      return;
    }
    this.columnSearchSubject.next(value);
  }

  private performGlobalSearch(term: string) {
    if (!term) {
      this.viewMode = 'initial';
      this.filteredTables = this.allTables;
      return;
    }

    this.viewMode = 'globalSearch';
    this.tablesService.getGlobalSearch(term).subscribe({
      next: (data) => {
        this.filteredTables = data.filter(t => t.rowData?.length).map(t => {
          const tableColumns: Column[] = t.columns.map((c: any) => ({
            columnName: c.columnName || c.ColumnName,
            dataType: c.dataType || c.DataType,
            isNullable: "true",
            maxLength: 255
          }));

          return {
            ...t,
            columns: tableColumns,
            expanded: false
          } as Table;
        });
      }
    });
  }

  private performTableFilter(term: string) {
    if (!term) {
      this.viewMode = 'initial';
      this.filteredTables = this.allTables;
      this.selectedTableForColumnSearch = null;
      return;
    }

    this.viewMode = 'tableSearch';
    this.filteredTables = this.allTables
      .filter(t => t.tableName.toLowerCase().includes(term.toLowerCase()))
      .map(t => ({ ...t, expanded: true }));

    if (this.filteredTables.length === 1) {
      this.selectedTableForColumnSearch = this.filteredTables[0];
    }
  }

  private performColumnSearch(value: string) {
    if (!this.selectedTableForColumnSearch || !this.selectedColumnsForSearch.length || !value.trim()) return;

    this.tablesService.searchColumns(
      this.selectedTableForColumnSearch.tableName,
      this.selectedColumnsForSearch,
      value.trim()
    ).subscribe({
      next: (data: any[]) => {
        if (data.length) {
          const originalTable = this.allTables.find(t => t.tableName === this.selectedTableForColumnSearch?.tableName);

          const table: Table = {
            ...this.selectedTableForColumnSearch!,
            columns: originalTable ? originalTable.columns : this.selectedTableForColumnSearch!.columns,
            rowData: data,
            expanded: true
          };

          this.selectedTableForColumnSearch = table;
          this.filteredTables = [table];
        }
      }
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
    this.selectedColumnsForSearch = this.selectAllColumns ? table.columns.map(c => c.columnName) : [];
  }

  getColumns(row: any): string[] {
    return row ? Object.keys(row) : [];
  }

  private resetColumnResults(): void {
    this.columnSearchValue = '';
    if (this.selectedTableForColumnSearch) {
      const tableCopy = {
        ...this.selectedTableForColumnSearch,
        expanded: true,
        rowData: []
      };
      this.filteredTables = [tableCopy];
    }
  }

  openEditModal(record: any, table: Table) {
    this.selectedRecord = { ...record };
    this.selectedTableForEdit = table;
  }

  saveEditedRecord(updatedRow: any) {
    const table = this.selectedTableForEdit;
    if (!table || !table.rowData) {
      console.warn('No table or rowData available for update');
      return;
    }

    // מחפשים את האינדקס רק אם rowData קיים
    const index = table.rowData.findIndex(r => r?.ID === updatedRow.ID);

    if (index > -1) {
      table.rowData[index] = { ...updatedRow }; // עדכון הרשומה הקיימת
    } else {
      console.warn('Record ID not found in rowData');
    }

    this.tablesService.updateRecord(table.tableName, updatedRow).subscribe({
      next: () => alert('Record updated successfully'),
      error: (err: any) => {
        console.error('Update failed:', err);
        alert(err.error);
      }
    });
  }
}