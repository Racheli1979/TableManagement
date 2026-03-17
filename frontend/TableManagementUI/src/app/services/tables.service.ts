import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Column {
  columnName: string;
  dataType: string;
  isNullable: string;
  maxLength: number | null;
}

export interface Table {
  tableName: string;
  schemaName: string;
  objectType: string;
  columns: Column[];
  rowData?: any[];
  expanded?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TablesService {
  private apiUrl = 'http://localhost:5081/api/tables';

  constructor(private http: HttpClient) { }

  getTables(): Observable<Table[]> {
    return this.http.get<Table[]>(this.apiUrl);
  }

  getGlobalSearch(term: string): Observable<Table[]> {
    return this.http.get<Table[]>(`${this.apiUrl}/search?term=${term}`);
  }

  searchColumns(tableName: string, columns: string[], searchValue: string): Observable<Table[]> {
    return this.http.post<Table[]>(`${this.apiUrl}/search-columns`, {
      tableName,
      columns,
      searchValue
    });
  }

  updateRecord(tableName: string, rowData: any) {
    return this.http.post(`${this.apiUrl}/update-record`, { tableName, rowData });
  }
}