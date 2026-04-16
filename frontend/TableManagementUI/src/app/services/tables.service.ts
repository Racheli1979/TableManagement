import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// הגדרת הממשקים (Interfaces) לפי ה-DTOs של ה-Backend
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
  rowData?: any[]; // הנתונים שנשלפים מהטבלה
  expanded?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TablesService {
  // וודא שהכתובת תואמת ל-Port שבו ה-API שלך רץ
  private apiUrl = 'http://localhost:5081/api/tables';

  constructor(private http: HttpClient) { }

  /**
   * שליפת רשימת כל הטבלאות והמטא-דאטה שלהן (עמודות)
   */
  getTables(): Observable<Table[]> {
    return this.http.get<Table[]>(this.apiUrl);
  }

  /**
   * חיפוש נתונים בתוך טבלה ספציפית לפי עמודה וערך
   * מתאים ל-Endpoint: [HttpPost("search")] ב-Controller
   */
  searchInTable(request: any) {
    return this.http.post('http://localhost:5081/api/Tables/search', request);
  }

  /**
   * עדכון רשומה קיימת בבסיס הנתונים
   * (הכנה לשלב הבא באפיון - דורש Endpoint תואם ב-API)
   */
  updateRecord(tableName: string, rowData: any, changeReason: string): Observable<any> {
    const payload = {
      tableName: tableName,
      data: rowData,
      reason: changeReason // חובה לפי דרישות האבטחה באפיון
    };
    return this.http.put(`${this.apiUrl}/update`, payload);
  }

  /**
   * הוספת רשומה חדשה לטבלה
   * (הכנה לשלב הבא באפיון)
   */
  insertRecord(tableName: string, rowData: any): Observable<any> {
    const payload = {
      tableName: tableName,
      data: rowData
    };
    return this.http.post(`${this.apiUrl}/insert`, payload);
  }

  /**
   * שליפת יומן שינויים (Audit Log)
   */
  getAuditLog(tableName?: string): Observable<any[]> {
    const url = tableName ? `${this.apiUrl}/audit?table=${tableName}` : `${this.apiUrl}/audit`;
    return this.http.get<any[]>(url);
  }
}