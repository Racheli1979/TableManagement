import { Injectable } from '@angular/core';
import { TablesService, TablePermissions } from './tables.service';
import { map, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {
  // 👤 - הרשאת מנהל ברירת מחדל
  private _currentUser: string = 'Manager';

  private _currentPermissions: TablePermissions = {
    canView: false, canAdd: false, canEdit: false, canDelete: false
  };

  get currentUser() {
    return this._currentUser;
  }

  setCurrentUser(user: string) {
    this._currentUser = user;
  }

  get permissions() {
    return this._currentPermissions;
  }

  constructor(private tablesService: TablesService) { }

  getTablePermissions(tableName: string): Observable<TablePermissions> {
    return this.tablesService.getTablePermissions(tableName, this._currentUser).pipe(
      map((perms: any) => ({
        canView: perms.CanView ?? perms.canView ?? false,
        canAdd: perms.CanAdd ?? perms.canAdd ?? false,
        canEdit: perms.CanEdit ?? perms.canEdit ?? false,
        canDelete: perms.CanDelete ?? perms.canDelete ?? false,
      })),
      tap(perms => {
        this._currentPermissions = perms;
      })
    );
  }
}