import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Column {
  columnName: string;
  dataType: string;
  isIdentity: number;
  isNullable: string;
  maxLength: number | null;
  isForeignKey: number;
  relatedTable: string | null;
}

export interface Table {
  tableName: string;
  schemaName: string;
  objectType: string;
  columns: Column[];
  rowData?: any[];
  expanded?: boolean;
}

export interface UpdateRecordRequest {
  TableName: string;
  UpdatedData: { [key: string]: any };
  IdValue: string;
  UpdateUser: string;
  Reason: string;
}

export interface DeleteRecordRequest {
  tableName: string;
  id: string;
  updateUser: string;
  reason: string;
}

export interface TablePermissions {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

// export interface AuditLog {
//   actionDate: string;
//   operation: string;
//   tableName: string;
//   recordId: string;
//   updateUser: string;
//   reason: string;
//   updatedData: string; 
// }

@Injectable({
  providedIn: 'root',
})
export class TablesService {
  private apiUrl = 'http://localhost:5081/api/tables';

  constructor(private http: HttpClient) {}

  getTables(): Observable<Table[]> {
    return this.http.get<Table[]>(this.apiUrl);
  }

  searchInTable(request: any): Observable<any> {
    return this.http.post<any>(
      'http://localhost:5081/api/tables/search',
      request,
    );
  }

  updateRecord(request: UpdateRecordRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/update`, request);
  }

  addRecord(request: {
    tableName: string;
    recordData: any;
    updateUser: string;
    reason: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, request);
  }

  deleteRecord(request: DeleteRecordRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/delete`, request);
  }

  // getAuditLogs(user?: string, dateFrom?: string): Observable<AuditLog[]> {
  //   let params = new HttpParams();

  //   if (user && user.trim() !== '') {
  //     params = params.set('user', user);
  //   }
    
  //   if (dateFrom) {
  //     params = params.set('dateFrom', dateFrom);
  //   }

  //   return this.http.get<AuditLog[]>(`${this.apiUrl}/audit-logs`, { params });
  // }

  getTablePermissions(tableName: string, userName: string): Observable<TablePermissions> {
    let params = new HttpParams()
      .set('tableName', tableName)
      .set('userName', userName);

    return this.http.get<TablePermissions>(`${this.apiUrl}/permissions`, { params });
  }
}
