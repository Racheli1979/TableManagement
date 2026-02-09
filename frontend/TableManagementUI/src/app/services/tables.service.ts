import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Column {
  ColumnName: string;
  DataType: string;
  IsNullable: string;
  MaxLength: number | null;
}

export interface Table {
  tableName: string;
  schemaName: string;
  objectType: string;
  columns: Column[];
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
}
