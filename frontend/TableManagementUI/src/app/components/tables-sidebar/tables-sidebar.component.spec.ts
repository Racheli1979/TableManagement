import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TablesSidebarComponent } from './tables-sidebar.component';

describe('TablesSidebarComponent', () => {
  let component: TablesSidebarComponent;
  let fixture: ComponentFixture<TablesSidebarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TablesSidebarComponent]
    });
    fixture = TestBed.createComponent(TablesSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
