import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Column {
  columnName: string;
  dataType: string;
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

@Injectable({
  providedIn: 'root'
})
export class TablesService {
  private apiUrl = 'http://localhost:5081/api/tables';

  constructor(private http: HttpClient) { }

  getTables(): Observable<Table[]> {
    return this.http.get<Table[]>(this.apiUrl);
  }

  searchInTable(request: any): Observable<any> {
    return this.http.post<any>('http://localhost:5081/api/tables/search', request);
  }
}