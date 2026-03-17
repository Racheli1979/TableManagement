import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TablesService {
  private apiUrl = 'http://localhost:5081/api/tables';

  constructor(private http: HttpClient) { }

  // שליפת מטא-דאטה של כל הטבלאות (US-1)
  getTables(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // חיפוש מאוחד - גלובלי או לפי עמודה (US-2)
  search(tableName: string, searchValue: string, columnName: string | null = null): Observable<any[]> {
    const body = {
      TableName: tableName,
      ColumnName: columnName, // null עבור חיפוש גלובלי
      SearchValue: searchValue
    };
    return this.http.post<any[]>(`${this.apiUrl}/search`, body);
  }
}