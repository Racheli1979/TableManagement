import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
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
  @Input() primaryKey: string = '';

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  
}
