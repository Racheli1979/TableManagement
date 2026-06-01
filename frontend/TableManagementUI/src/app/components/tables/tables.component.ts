import { Component, OnInit, OnDestroy } from '@angular/core';
import { TablesService, Table } from '../../services/tables.service';
import { PermissionsService } from '../../services/permissions.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-tables',
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.scss'],
})
export class TablesComponent implements OnInit, OnDestroy {
  showAuditLog: boolean = false;
  selectedTableForColumnSearch: Table | null = null;
  selectedRecord: any = null;
  selectedTableForEdit: Table | null = null;
  isNewRecordMode: boolean = false;
  showReasonModal = false;
  reasonModalData: any = {};
  pendingAction: { type: 'ADD' | 'UPDATE' | 'DELETE'; data: any } | null = null;

  constructor(
    private tablesService: TablesService,
    public permissionsService: PermissionsService,
  ) {}

  ngOnInit(): void {}

  toggleTable(table: Table | null): void {
    if (!table) {
      this.selectedTableForColumnSearch = null;
      return;
    }
    this.showAuditLog = false;
    this.selectedTableForColumnSearch = table;

    this.permissionsService.getTablePermissions(table.tableName).subscribe({
      next: (perms) => {
        if (!perms.canView) {
          table.rowData = [];
          alert(`אין לך הרשאת צפייה בטבלה ${table.tableName}`);
          return;
        }
        this.loadTableData(table);
      },
      error: (err) => console.error('Error fetching permissions:', err),
    });
  }

  private loadTableData(table: Table): void {
    const request = {
      TableName: table.tableName,
      ColumnName: table.columns[0]?.columnName || '',
      SearchValue: '',
    };
    this.tablesService.searchInTable(request).subscribe({
      next: (data: any) => (table.rowData = data),
      error: (err) => {
        alert(`שים לב: ${err.error?.message || 'שגיאה בשליפת נתונים'}`);
        table.rowData = [];
      },
    });
  }

  onRowActionFromGrid(event: any) {
    if (event.type === 'EDIT') this.openEditModal(event.data);
    else if (event.type === 'DELETE') this.onDelete(event.data);
  }

  openEditModal(row: any) {
    if (!this.permissionsService.permissions.canEdit) {
      alert('אין לך הרשאה לערוך רשומות בטבלה זו');
      return;
    }
    this.isNewRecordMode = false;
    const cleanedRow = { ...row };

    if (this.selectedTableForColumnSearch?.columns) {
      this.selectedTableForColumnSearch.columns.forEach((col) => {
        if (
          col.dataType?.toLowerCase().includes('date') &&
          cleanedRow[col.columnName]
        ) {
          cleanedRow[col.columnName] = cleanedRow[col.columnName]
            .toString()
            .split('T')[0];
        }
      });
    }

    this.selectedRecord = cleanedRow;
    this.selectedTableForEdit = this.selectedTableForColumnSearch;
  }

  openAddModal() {
    if (!this.permissionsService.permissions.canAdd) return;
    this.isNewRecordMode = true;
    this.selectedTableForEdit = this.selectedTableForColumnSearch;
    this.selectedRecord = {};
  }

  handleDataFromManage(data: any) {
    this.pendingAction = {
      type: this.isNewRecordMode ? 'ADD' : 'UPDATE',
      data,
    };
    this.reasonModalData = {
      title: this.isNewRecordMode ? 'הוספת רשומה' : 'עריכת רשומה',
      description: 'נא להזין סיבה לשינוי המידע',
      actionName: this.isNewRecordMode ? 'הוסף' : 'שמור',
      minLength: 5,
    };
    this.selectedRecord = null;
    this.showReasonModal = true;
  }

  onDelete(row: any) {
    if (!this.permissionsService.permissions.canDelete) return;
    this.pendingAction = { type: 'DELETE', data: row };
    this.reasonModalData = {
      title: 'מחיקת רשומה',
      description: 'נא להזין סיבה למחיקה',
      actionName: 'מחק',
      minLength: 5,
    };
    this.showReasonModal = true;
  }

  async finalizeAction(reasonText: string) {
    if (!this.pendingAction || !this.selectedTableForColumnSearch) return;
    const { type, data } = this.pendingAction;
    this.showReasonModal = false;

    try {
      if (type === 'ADD') await this.executeAdd(data, reasonText);
      else if (type === 'UPDATE') await this.executeUpdate(data, reasonText);
      else if (type === 'DELETE') await this.executeDelete(data, reasonText);

      alert('הפעולה בוצעה בהצלחה');
      this.toggleTable(this.selectedTableForColumnSearch);
    } catch (err: any) {
      alert(err.error?.message || 'הפעולה נכשלה');
    }
    this.resetState();
  }

  private async executeAdd(data: any, reason: string) {
    const d = this.cleanAudit(data);
    await firstValueFrom(
      this.tablesService.addRecord({
        tableName: this.selectedTableForColumnSearch!.tableName,
        recordData: d,
        updateUser: this.permissionsService.currentUser,
        reason,
      }),
    );
  }

  private async executeUpdate(data: any, reason: string) {
    const idValue = String(data['Id'] || data['ID'] || data['id']);
    const updatedFields: any = {};
    this.selectedTableForColumnSearch!.columns.forEach((col) => {
      if (data[col.columnName] !== data[col.columnName + '_Original'])
        updatedFields[col.columnName] = data[col.columnName];
    });
    await firstValueFrom(
      this.tablesService.updateRecord({
        TableName: this.selectedTableForColumnSearch!.tableName,
        IdValue: idValue,
        UpdateUser: this.permissionsService.currentUser,
        Reason: reason,
        UpdatedData: updatedFields,
      }),
    );
  }

  private async executeDelete(data: any, reason: string) {
    const rawId = data.Id || data.id || data.ID;
    const idValue = String(rawId);

    await firstValueFrom(
      this.tablesService.deleteRecord({
        tableName: this.selectedTableForColumnSearch!.tableName,
        id: idValue, 
        updateUser: this.permissionsService.currentUser,
        reason,
      }),
    );
  }

  private cleanAudit(data: any) {
    const d = { ...data };
    ['CREATE_DATE', 'CREATE_USER', 'UPDATE_DATE', 'UPDATE_USER'].forEach(
      (f) => delete d[f],
    );
    return d;
  }

  private resetState() {
    this.showReasonModal = false;
    this.pendingAction = null;
    this.isNewRecordMode = false;
    this.selectedRecord = null;
  }

  // openAuditLog() {
  //   this.showAuditLog = true;
  //   this.selectedTableForColumnSearch = null;
  // }

  ngOnDestroy() {}
}
