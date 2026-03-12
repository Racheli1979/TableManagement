import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Column } from 'src/app/services/tables.service';

@Component({
  selector: 'app-edit-record-modal',
  templateUrl: './edit-record-modal.component.html',
  styleUrls: ['./edit-record-modal.component.scss']
})
export class EditRecordModalComponent {

  @Input() row: any;
  @Input() columns: Column[] = [];
  @Input() tableName: string = '';

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  cancel() {
    this.close.emit();
  }

  saveRecord() {
    this.save.emit(this.row);
  }

  getInputType(col: Column): string {
    const type = col.DataType?.toLowerCase() || '';

    if (type.includes('number') || type.includes('int')) {
      return 'number';
    }

    if (type.includes('date')) {
      return 'date';
    }

    return 'text';
  }
}