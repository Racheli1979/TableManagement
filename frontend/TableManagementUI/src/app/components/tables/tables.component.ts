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

  globalSearch: string = '';
  columnFilters: { [key: string]: string } = {};

  private tableSearchSubject = new Subject<string>();
  private subscriptions: Subscription[] = [];

  isNewRecordMode: boolean = false;

  constructor(private tablesService: TablesService) { }

  ngOnInit(): void {
    this.loadInitialData();

    this.subscriptions.push(
      this.tableSearchSubject.pipe(
        debounceTime(200),
        distinctUntilChanged()
      ).subscribe(term => {
        if (!term || term.trim() === '') {
          this.filteredTables = [...this.allTables];
          this.selectedTableForColumnSearch = null;
          this.showAuditLog = false;
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
          schemaName: t.schemaName || t.SchemaName,
          objectType: t.objectType || t.ObjectType,
          columns: (t.columns || t.Columns || []).map((c: any) => ({
            columnName: c.columnName || c.ColumnName,
            dataType: c.dataType || c.DataType,
            isNullable: c.isNullable || c.IsNullable,
            maxLength: c.maxLength || c.MaxLength,
            isForeignKey: c.isForeignKey || c.IsForeignKey,
            relatedTable: c.relatedTable || c.RelatedTable
          }))
        }));
        this.filteredTables = [...this.allTables];
      },
      error: (err) => {
        alert('שגיאה בטעינת הטבלאות: ' + (err.error?.message || 'תקלת תקשורת'));
      }
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
      ColumnName: table.columns[0]?.columnName || '',
      SearchValue: ''
    };

    this.tablesService.searchInTable(request)
      .subscribe({
        next: (data: any) => {
          table.rowData = data;
        },
        error: (err) => {
          console.error('Search Error:', err);
          const errorMessage = err.error?.message || err.error || 'שגיאה בשליפת נתונים';
          alert(`שים לב: ${errorMessage}`);

          table.rowData = [];
        }
      });
  }

  getFilteredRows(): any[] {
    let rows = this.selectedTableForColumnSearch?.rowData || [];

    if (this.globalSearch) {
      const search = this.globalSearch.toLowerCase();
      rows = rows.filter(row =>
        this.selectedTableForColumnSearch!.columns.some(col => {
          const val = row[col.columnName]?.toString().toLowerCase() || '';
          const displayVal = row[col.columnName + '_Display']?.toString().toLowerCase() || '';
          return val.includes(search) || displayVal.includes(search);
        })
      );
    }
    const filterKeys = Object.keys(this.columnFilters);
    if (filterKeys.length > 0) {
      rows = rows.filter(row => {
        return filterKeys.every(colName => {
          const filterValue = this.columnFilters[colName]?.toLowerCase();
          if (!filterValue) return true;

          const originalValue = row[colName]?.toString().toLowerCase() || '';
          const displayValue = row[colName + '_Display']?.toString().toLowerCase() || '';

          return originalValue.includes(filterValue) || displayValue.includes(filterValue);
        });
      });
    }

    return rows;
  }

  getVisibleColumns(): Column[] {
    if (!this.selectedTableForColumnSearch || !this.selectedTableForColumnSearch.columns) {
      return [];
    }
    const auditFields = ['CREATE_USER', 'CREATE_DATE', 'UPDATE_USER', 'UPDATE_DATE'];
    return this.selectedTableForColumnSearch.columns.filter(col =>
      !auditFields.includes(col.columnName.toUpperCase())
    );
  }

  openEditModal(record: any) {
    this.isNewRecordMode = false;
    this.selectedRecord = { ...record };
  }

  handleSave(updatedData: any) {
    console.log('נתונים לשמירה:', updatedData);

    if (this.selectedTableForEdit) {
      this.selectedRecord = null;
      alert('הפעולה בוצעה בהצלחה');
      this.toggleTable(this.selectedTableForEdit);
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  openAddModal() {
    this.isNewRecordMode = true;
    this.selectedTableForEdit = this.selectedTableForColumnSearch;
    this.selectedRecord = {};
    console.log('Table for add:', this.selectedTableForEdit);
  }

  onDelete(row: any) {
    const idValue = row.Id || row.id || row.ID;
    if (!this.selectedTableForColumnSearch) return;

    const tableName = this.selectedTableForColumnSearch.tableName;

    if (confirm(`האם את בטוחה שברצונך למחוק את רשומה ${idValue}?`)) {
      this.tablesService.deleteRecord(tableName, idValue.toString()).subscribe({
        next: (res) => {
          alert(res.message || 'הרשומה נמחקה בהצלחה');

          if (this.selectedTableForColumnSearch) {
            this.toggleTable(this.selectedTableForColumnSearch);
          }
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'שגיאה במחיקה';
          alert(errorMessage);
        }
      });
    }
  }
}