import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, Column, TablesService } from '../../services/tables.service'; 

@Component({
  selector: 'app-edit-record-modal',
  templateUrl: './edit-record-modal.component.html',
  styleUrls: ['./edit-record-modal.component.scss']
})
export class EditRecordModalComponent implements OnInit { 
  @Input() table: Table | null = null;
  @Input() record: any = {};
  localRecord: any;

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  readonly auditFields = ['CREATE_USER', 'CREATE_DATE', 'UPDATE_USER', 'UPDATE_DATE'];
  lookups: { [key: string]: any[] } = {};

  constructor(private tablesService: TablesService) { }

  ngOnInit() {
    this.localRecord = JSON.parse(JSON.stringify(this.record));
    this.loadLookups();
  }

  onClose() {

    this.close.emit();
  }

  onSave() {
    this.save.emit(this.localRecord);
  }

  getVisibleColumns(): Column[] {
    if (!this.table || !this.table.columns) return [];
    return this.table.columns.filter(col =>
      !this.auditFields.includes(col.columnName.toUpperCase())
    );
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
          error: (err) => console.error(`שגיאה בטעינת נתונים עבור ${col.relatedTable}:`, err)
        });
      }
    });
  }
  isLookup(columnName: string): boolean {
    return !!this.lookups[columnName];
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

    const fieldsToHide = [
      'Id',
      'CREATE_DATE',
      'CREATE_USER',
      'UPDATE_DATE',
      'UPDATE_USER'
    ];

    return this.table.columns.filter(col =>
      !fieldsToHide.includes(col.columnName)
    );
  }

  readonly staticOptions: { [key: string]: string[] } = {
    'StatusName': ['Pending', 'Completed', 'Cancelled', 'Processing', 'Shipped']
  };

  hasStaticOptions(columnName: string): boolean {
    return !!this.staticOptions[columnName];
  }
}