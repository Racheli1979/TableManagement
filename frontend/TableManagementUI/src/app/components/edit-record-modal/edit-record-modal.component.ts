import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, Column, TablesService } from '../../services/tables.service';
import { forkJoin, firstValueFrom } from 'rxjs';


@Component({
  selector: 'app-edit-record-modal',
  templateUrl: './edit-record-modal.component.html',
  styleUrls: ['./edit-record-modal.component.scss']
})
export class EditRecordModalComponent implements OnInit {
  @Input() table: Table | null = null;
  @Input() record: any = {};
  localRecord: any;
  errors: { [key: string]: string } = {};

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  readonly auditFields = ['CREATE_USER', 'CREATE_DATE', 'UPDATE_USER', 'UPDATE_DATE'];
  lookups: { [key: string]: any[] } = {};

  get hasValidationErrors(): boolean {
    if (Object.keys(this.errors).length > 0) return true;

    const columns = this.getEditableColumns();
    for (const col of columns) {
      if (this.isRequired(col)) {
        const value = this.localRecord[col.columnName];
        if (value === null || value === undefined || String(value).trim() === '') {
          return true;
        }
      }
    }
    return false;
  }

  isRequired(col: any): boolean {
    const val = col.IsNullable || col.isNullable;
    return val === 'NO' || val === '0' || val === 0 || val === 'N';
  }
  constructor(private tablesService: TablesService) { }

  ngOnInit() {
    this.localRecord = JSON.parse(JSON.stringify(this.record));
    this.loadLookups();
  }

  onClose() {
    this.close.emit();
  }

  loadLookups() {
    if (!this.table) return;

    this.table.columns.forEach(col => {
      if (col.isForeignKey === 1 && col.relatedTable) {
        const request = {
          TableName: col.relatedTable,
          ColumnName: null,
          SearchValue: null
        };

        this.tablesService.searchInTable(request).subscribe({
          next: (data: any) => {
            this.lookups[col.columnName] = data;
          },
          error: (err) => console.error(`Error loading lookup for ${col.relatedTable}:`, err)
        });
      }
    });
  }

  getInputType(dataType: string): string {
    const type = dataType?.toLowerCase() || '';
    if (type.includes('date')) return 'date';
    if (type === 'int' || type === 'decimal' || type === 'float') return 'number';
    return 'text';
  }

  displayTransform(value: any, dataType: string): any {
    if (!value) return '';
    const type = dataType?.toLowerCase() || '';
    if (type.includes('date')) {
      return value.toString().split('T')[0];
    }
    return value;
  }

  saveTransform(newValue: any, dataType: string): any {
    const type = dataType?.toLowerCase() || '';
    if (type === 'int') return parseInt(newValue) || 0;
    if (type === 'decimal' || type === 'float') return parseFloat(newValue) || 0;
    return newValue;
  }

  isReadOnly(columnName: string): boolean {
    const readonlyFields = ['Id', 'CREATE_DATE', 'CREATE_USER', 'UPDATE_DATE', 'UPDATE_USER'];
    return readonlyFields.includes(columnName);
  }

  getEditableColumns() {
    if (!this.table?.columns) return [];
    const fieldsToHide = ['Id', 'CREATE_DATE', 'CREATE_USER', 'UPDATE_DATE', 'UPDATE_USER'];
    return this.table.columns.filter(col => !fieldsToHide.includes(col.columnName));
  }

  clearError(columnName: string) {
    if (this.errors[columnName]) {
      delete this.errors[columnName];
    }
  }

  validateSingleField(col: any) {
    const value = this.localRecord[col.columnName];
    const stringValue = (value !== null && value !== undefined) ? String(value).trim() : '';
    const dataType = col.dataType?.toLowerCase() || '';

    const colName = col.columnName.toLowerCase();

    delete this.errors[col.columnName];

    if (this.isRequired(col) && stringValue === '') {
      this.errors[col.columnName] = 'שדה זה הוא חובה';
      return;
    }

    const isPureTextTemplate = ['name', 'city', 'country', 'desc'].some(t => colName.includes(t));

    if (isPureTextTemplate && stringValue !== '') {
      const alphaPattern = /^[a-zA-Zא-ת\s'-]+$/;
      if (!alphaPattern.test(stringValue)) {
        this.errors[col.columnName] = 'חובה להזין אותיות בלבד';
        return;
      }
    }

    const isNumericTemplate = ['int', 'decimal', 'float', 'number', 'bit'].some(t => dataType.includes(t));

    if (isNumericTemplate && stringValue !== '') {
      if (isNaN(Number(stringValue))) {
        this.errors[col.columnName] = 'חובה להזין מספר תקין';
        return;
      }
    }

    if (colName.includes('email') && stringValue !== '') {
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailPattern.test(stringValue)) {
        this.errors[col.columnName] = 'כתובת אימייל לא תקינה';
        return;
      }
    }

    if (col.maxLength && col.maxLength > 0 && stringValue.length > col.maxLength) {
      this.errors[col.columnName] = `הכנס ${col.columnName} באורך עד ${col.maxLength} תווים`;
    }

    const forbidden = ['DROP', 'DELETE', 'UPDATE', 'SELECT', 'TRUNCATE', '--'];
    if (forbidden.some(word => stringValue.toUpperCase().includes(word))) {
      this.errors[col.columnName] = 'ערך לא חוקי!';
      return;
    }
  }

  validateAll(): boolean {
    const columns = this.getEditableColumns();

    columns.forEach(col => {
      this.validateSingleField(col);
    });

    return Object.keys(this.errors).length === 0;
  }

  async onSave() {
    if (!this.validateAll()) return;

    const tableName = this.table?.tableName || '';
    const idValue = String(this.localRecord['Id'] || this.localRecord['ID'] || this.localRecord['id']);
    const tempUser = 'System_Admin_Test';

    const editableColumns = this.getEditableColumns();

    const updateTasks = editableColumns
      .filter(col => {
        const newValue = this.localRecord[col.columnName];
        const oldValue = this.record[col.columnName];
        return newValue !== oldValue;
      })
      .map(col => {
        const request = {
          tableName: tableName,
          columnName: col.columnName,
          newValue: String(this.localRecord[col.columnName]),
          idValue: idValue,
          updateUser: tempUser
        };
        return this.tablesService.updateRecord(request);
      });

    if (updateTasks.length === 0) {
      alert('לא בוצעו שינויים לשמירה.');
      this.onClose();
      return;
    }

    try {
      await firstValueFrom(forkJoin(updateTasks));
      this.save.emit(this.localRecord);
      this.onClose();

    } catch (err: any) {
      console.error('Save failed:', err);
      alert('שגיאה בשמירה: ' + (err.error?.message || 'אחד העדכונים נכשל'));
    }
  }
}
