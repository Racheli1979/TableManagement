import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { TablesService, Table } from '../../services/tables.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-table-sidebar',
  templateUrl: './tables-sidebar.component.html',
  styleUrls: ['./tables-sidebar.component.scss'],
})
export class TablesSidebarComponent implements OnInit, OnDestroy {
  @Input() selectedTable: Table | null = null;
  @Input() showAuditLog: boolean = false;
  @Input() currentUser!: string;

  @Output() tableSelected = new EventEmitter<Table | null>();
  @Output() auditLogClicked = new EventEmitter<void>();

  allTables: Table[] = [];
  filteredTables: Table[] = [];
  searchTermTable: string = '';

  private tableSearchSubject = new Subject<string>();
  private subscriptions: Subscription[] = [];

  constructor(private tablesService: TablesService) {}

  ngOnInit(): void {
    this.loadInitialData();

    this.subscriptions.push(
      this.tableSearchSubject
        .pipe(debounceTime(200), distinctUntilChanged())
        .subscribe((term) => {
          if (!term || term.trim() === '') {
            this.filteredTables = [...this.allTables];
            this.tableSelected.emit(null);
            return;
          } else {
            this.filteredTables = this.allTables.filter((t) =>
              t.tableName.toLowerCase().includes(term.toLowerCase()),
            );
          }

          if (this.filteredTables.length === 1) {
            const onlyTable = this.filteredTables[0];

            if (this.selectedTable?.tableName !== onlyTable.tableName) {
              this.onTableClick(onlyTable);
            }
          }
        }),
    );
  }

  loadInitialData() {
    this.tablesService.getTables().subscribe({
      next: (data: any[]) => {
        const mappedTables = data.map((t) => ({
          tableName: t.TableName,
          schemaName: t.SchemaName,
          objectType: t.ObjectType,
          columns: (t.Columns || []).map((c: any) => ({
            columnName: c.ColumnName,
            dataType: c.DataType,
            isNullable: c.IsNullable,
            isIdentity: c.IsIdentity,
            maxLength: c.MaxLength,
            isForeignKey: c.IsForeignKey,
            relatedTable: c.RelatedTable,
          })),
        }));

        const permissionRequests = mappedTables.map((table) =>
          this.tablesService.getTablePermissions(
            table.tableName,
            this.currentUser,
          ),
        );

        forkJoin(permissionRequests).subscribe({
          next: (permissionsList: any[]) => {
            this.allTables = mappedTables.filter((table, index) => {
              const perms = permissionsList[index];
              const canView = perms?.CanView ?? perms?.canView ?? false;
              return canView === true;
            });

            this.filteredTables = [...this.allTables];
          },
          error: (err) => {
            console.error('שגיאה בטעינת הרשאות הטבלאות:', err);
          },
        });
      },
      error: (err) => {
        alert('שגיאה בטעינת הטבלאות: ' + (err.error?.message || 'תקלת תקשורת'));
      },
    });
  }

  onTableSearchInput() {
    this.tableSearchSubject.next(this.searchTermTable);
  }

  onTableClick(table: Table) {
    this.tableSelected.emit(table);
  }

  onAuditLogClick() {
    this.auditLogClicked.emit();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
