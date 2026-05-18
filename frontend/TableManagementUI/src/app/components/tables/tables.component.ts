import { Component, OnInit, OnDestroy } from '@angular/core';
import { TablesService, Table, Column } from '../../services/tables.service';
import { Subject, Subscription, forkJoin, firstValueFrom } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-tables',
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.scss'],
})
export class TablesComponent implements OnInit, OnDestroy {
  allTables: Table[] = [];
  filteredTables: Table[] = [];
  visibleColumns: Column[] = [];
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

  constructor(private tablesService: TablesService) {}

  ngOnInit(): void {
    this.loadInitialData();

    this.subscriptions.push(
      this.tableSearchSubject
        .pipe(debounceTime(200), distinctUntilChanged())
        .subscribe((term) => {
          if (!term || term.trim() === '') {
            this.filteredTables = [...this.allTables];
            this.selectedTableForColumnSearch = null;
            this.showAuditLog = false;
            this.allTables.forEach((t) => (t.rowData = undefined));
            return;
          }

          const filtered = this.allTables.filter((t) =>
            t.tableName.toLowerCase().includes(term.toLowerCase()),
          );

          this.filteredTables = filtered;

          if (filtered.length === 1) {
            this.toggleTable(filtered[0]);
          }
        }),
    );
  }

  loadInitialData() {
    this.tablesService.getTables().subscribe({
      next: (data: any[]) => {
        this.allTables = data.map((t) => ({
          tableName: t.tableName || t.TableName,
          schemaName: t.schemaName || t.SchemaName,
          objectType: t.objectType || t.ObjectType,
          columns: (t.columns || t.Columns || []).map((c: any) => ({
            columnName: c.columnName || c.ColumnName,
            dataType: c.dataType || c.DataType,
            isNullable: c.isNullable || c.IsNullable,
            maxLength: c.maxLength || c.MaxLength,
            isForeignKey: c.isForeignKey || c.IsForeignKey,
            relatedTable: c.relatedTable || c.RelatedTable,
          })),
        }));
        this.filteredTables = [...this.allTables];
      },
      error: (err) => {
        alert('שגיאה בטעינת הטבלאות: ' + (err.error?.message || 'תקלת תקשורת'));
      },
    });
  }

  onTableSearchInput() {
    this.tableSearchSubject.next(this.searchTermTable);
  }

  toggleTable(table: Table): void {
    this.showAuditLog = false;
    this.selectedTableForColumnSearch = table;

    const auditFields = [
      'CREATE_USER',
      'CREATE_DATE',
      'UPDATE_USER',
      'UPDATE_DATE',
    ];
    this.visibleColumns = [...table.columns].sort((a, b) => {
      const isAAudit = auditFields.includes(a.columnName.toUpperCase());
      const isBAudit = auditFields.includes(b.columnName.toUpperCase());
      return (isAAudit ? 1 : 0) - (isBAudit ? 1 : 0);
    });

    const request = {
      TableName: table.tableName,
      ColumnName: table.columns[0]?.columnName || '',
      SearchValue: '',
    };

    this.tablesService.searchInTable(request).subscribe({
      next: (data: any) => {
        table.rowData = data;
      },
      error: (err) => {
        console.error('Search Error:', err);
        const errorMessage =
          err.error?.message || err.error || 'שגיאה בשליפת נתונים';
        alert(`שים לב: ${errorMessage}`);

        table.rowData = [];
      },
    });
  }

  getFilteredRows(): any[] {
    let rows = this.selectedTableForColumnSearch?.rowData || [];

    if (this.globalSearch) {
      const search = this.globalSearch.toLowerCase();
      rows = rows.filter((row) =>
        this.selectedTableForColumnSearch!.columns.some((col) => {
          const val = row[col.columnName]?.toString().toLowerCase() || '';
          const displayVal =
            row[col.columnName + '_Display']?.toString().toLowerCase() || '';
          return val.includes(search) || displayVal.includes(search);
        }),
      );
    }
    const filterKeys = Object.keys(this.columnFilters);
    if (filterKeys.length > 0) {
      rows = rows.filter((row) => {
        return filterKeys.every((colName) => {
          const filterValue = this.columnFilters[colName]?.toLowerCase();
          if (!filterValue) return true;

          const originalValue = row[colName]?.toString().toLowerCase() || '';
          const displayValue =
            row[colName + '_Display']?.toString().toLowerCase() || '';

          return (
            originalValue.includes(filterValue) ||
            displayValue.includes(filterValue)
          );
        });
      });
    }

    return rows;
  }

  openEditModal(row: any) {
    this.isNewRecordMode = false;
    this.selectedRecord = { ...row };
    this.selectedTableForEdit = this.selectedTableForColumnSearch;
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
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  openAddModal() {
    this.isNewRecordMode = true;
    this.selectedTableForEdit = this.selectedTableForColumnSearch;
    this.selectedRecord = {};
    console.log('Table for add:', this.selectedTableForEdit);
  }

  showReasonModal = false;
  reasonModalData: any = {};
  pendingAction: { type: 'ADD' | 'UPDATE' | 'DELETE'; data: any } | null = null;

  handleDataFromManage(data: any) {
    this.pendingAction = {
      type: this.isNewRecordMode ? 'ADD' : 'UPDATE',
      data: data,
    };

    this.reasonModalData = {
      title: this.isNewRecordMode ? 'הוספת רשומה' : 'עריכת רשומה',
      description: 'נא להזין סיבה לשינוי המידע בטבלה',
      actionName: this.isNewRecordMode ? 'הוסף' : 'שמור',
      minLength: 5,
    };

    this.selectedRecord = null;
    this.showReasonModal = true;
  }

  onDelete(row: any) {
    this.pendingAction = { type: 'DELETE', data: row };
    this.reasonModalData = {
      title: 'מחיקת רשומה',
      description: 'נא להזין סיבה למחיקת הרשומה מהמערכת',
      actionName: 'מחק',
      minLength: 5,
    };
    this.showReasonModal = true;
  }

  async finalizeAction(reasonText: string) {
    if (!this.pendingAction || !this.selectedTableForColumnSearch) return;

    const { type, data } = this.pendingAction;
    const tableName = this.selectedTableForColumnSearch.tableName;
    this.showReasonModal = false;

    try {
      if (type === 'ADD') {
        await firstValueFrom(
          this.tablesService.addRecord({
            tableName,
            recordData: data,
            updateUser: 'Admin',
            reason: reasonText,
          }),
        );
      } else if (type === 'UPDATE') {
        const idValue = String(data['Id'] || data['ID'] || data['id']);

        const forbiddenFields = [
          'Id',
          'ID',
          'id',
          'CREATE_DATE',
          'CREATE_USER',
          'UPDATE_DATE',
          'UPDATE_USER',
        ];

        const updatedFields: { [key: string]: any } = {};

        this.selectedTableForColumnSearch.columns.forEach((col) => {
          const colName = col.columnName;
          if (
            !forbiddenFields.includes(colName) &&
            !colName.endsWith('_Display')
          ) {
            const newValue = data[colName];
            const originalValue = data[colName + '_Original'];

            if (String(newValue) !== String(originalValue || '')) {
              updatedFields[colName] = newValue;
            }
          }
        });

        if (Object.keys(updatedFields).length === 0) {
          alert('לא בוצעו שינויים ברשומה');
          return;
        }

        await firstValueFrom(
          this.tablesService.updateRecord({
            TableName: tableName,
            IdValue: idValue,
            UpdateUser: 'Admin',
            Reason: reasonText,
            UpdatedData: updatedFields,
          } as any),
        );
      } else if (type === 'DELETE') {
        const idValue = data.Id || data.id || data.ID;
        await firstValueFrom(
          this.tablesService.deleteRecord({
            tableName,
            id: idValue,
            updateUser: 'Admin',
            reason: reasonText,
          }),
        );
      }

      alert('הפעולה בוצעה בהצלחה');
      this.toggleTable(this.selectedTableForColumnSearch);
    } catch (err: any) {
      console.error('Finalize Error:', err);
      let errorMessage = 'הפעולה נכשלה בשרת';

      if (typeof err.error === 'string') {
        errorMessage = err.error;
      } else if (err.error && err.error.message) {
        errorMessage = err.error.message;
      } else if (err.error && err.error.errors) {
        errorMessage = Object.values(err.error.errors).flat().join('\n');
      }

      alert(errorMessage);
    }
    this.showReasonModal = false;
    this.pendingAction = null;
    this.isNewRecordMode = false;
  }

  // openAuditLog() {
  //   this.showAuditLog = true;
  //   this.selectedTableForColumnSearch = null;
  // }
}