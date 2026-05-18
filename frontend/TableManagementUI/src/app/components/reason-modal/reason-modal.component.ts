import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reason-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reason-modal.component.html',
  styleUrls: ['./reason-modal.component.scss']
})
export class ReasonModalComponent {
  @Input() data: any = {
    title: 'אישור פעולה',
    description: 'אנא הזן סיבה לביצוע הפעולה.',
    actionName: 'אישור ושמירה',
    minLength: 5
  };

  @Output() confirm = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  reasonText: string = '';

  onConfirm() {
    if (this.reasonText.trim().length >= (this.data.minLength || 5)) {
      this.confirm.emit(this.reasonText);
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}