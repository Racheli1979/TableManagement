import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableGridComponent } from './tables-grid.component';

describe('TablesGridComponent', () => {
  let component: TableGridComponent;
  let fixture: ComponentFixture<TableGridComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TableGridComponent]
    });
    fixture = TestBed.createComponent(TableGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
