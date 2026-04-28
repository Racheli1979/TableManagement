import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageRecordModalComponent } from './manage-record-modal.component';

describe('EditRecordModalComponent', () => {
  let component: ManageRecordModalComponent;
  let fixture: ComponentFixture<ManageRecordModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ManageRecordModalComponent]
    });
    fixture = TestBed.createComponent(ManageRecordModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
