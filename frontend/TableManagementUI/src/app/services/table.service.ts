import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TableData {
  tableName: string;
  columns: any[];
}

@Injectable({
  providedIn: 'root'
})
export class TableService {
  private apiUrl = 'http://localhost:5081/api/tables';

  constructor(private http: HttpClient) { }
  
  getTables(): Observable<TableData[]> {
    return this.http.get<TableData[]>(this.apiUrl);
  }
}
