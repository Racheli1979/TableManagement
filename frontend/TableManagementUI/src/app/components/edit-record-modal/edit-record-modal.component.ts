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
  saveRecord() { this.save.emit(this.row); this.close.emit(); }

  getInputType(col: Column): string {
    const type = col.dataType?.toLowerCase() || '';
    if (type.includes('number') || type.includes('int') || type.includes('decimal') || type.includes('money')) return 'number';
    if (type.includes('date') || type.includes('time')) return 'date';
    if (type.includes('bit')) return 'checkbox';
    return 'text';
  }
}