import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Column } from 'src/app/services/tables.service';

@Component({
  selector: 'app-edit-record-modal',
  templateUrl: './edit-record-modal.component.html',
  styleUrls: ['./edit-record-modal.component.scss']
})
export class EditRecordModalComponent implements OnInit {
  @Input() row: any;
  @Input() columns: Column[] = [];
  @Input() tableName: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  validationErrors: string[] = [];

  ngOnInit() {
    this.columns.forEach(col => {
      if (this.getInputType(col) === 'date' && this.row[col.columnName]) {
        try {
          this.row[col.columnName] = new Date(this.row[col.columnName]).toISOString().split('T')[0];
        } catch (e) {
          console.error("Invalid date format", this.row[col.columnName]);
        }
      }
    });
  }

  cancel() { this.close.emit(); }

  saveRecord() {
    this.validationErrors = [];
    if (!this.validateRecord()) return;
    this.save.emit(this.row);  // שולח ל-component ההורה
    this.close.emit();
  }

  validateRecord(): boolean {
    for (let col of this.columns) {
      const value = this.row[col.columnName];

      // חובה
      if (col.isNullable === 'N' && (value === null || value === undefined || value === '')) {
        this.validationErrors.push(`${col.columnName} is required`);
      }

      // סוגי עמודות
      const type = col.dataType?.toLowerCase() || '';
      if ((type.includes('int') || type.includes('number')) && isNaN(value)) {
        this.validationErrors.push(`${col.columnName} must be a number`);
      }
      if (type.includes('date') && isNaN(Date.parse(value))) {
        this.validationErrors.push(`${col.columnName} must be a valid date`);
      }
      if (type.includes('bit') && typeof value !== 'boolean') {
        this.validationErrors.push(`${col.columnName} must be true/false`);
      }
    }
    return this.validationErrors.length === 0;
  }

  getInputType(col: Column): string {
    const type = col.dataType?.toLowerCase() || '';
    if (type.includes('number') || type.includes('int') || type.includes('decimal') || type.includes('money')) return 'number';
    if (type.includes('date') || type.includes('time')) return 'date';
    if (type.includes('bit')) return 'checkbox';
    return 'text';
  }
}