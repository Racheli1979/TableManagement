// import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
// import { TablesService, AuditLog } from '../../services/tables.service'; 
// import { DatePipe } from '@angular/common';

// @Component({
//   selector: 'app-audit-log',
//   templateUrl: './audit-log.component.html',
//   styleUrls: ['./audit-log.component.scss'],
// })
// export class AuditLogComponent implements OnInit {
//   @Input() tableName: string = ''; 
//   @Output() close = new EventEmitter<void>();

//   logs: AuditLog[] = []; 
//   errorMessage: string | null = null; 

//   filterValues = {
//     actionDate: '',
//     updateUser: '',
//   };

//   selectedLogData: any = null;

//   constructor(private tablesService: TablesService) {}

//   ngOnInit(): void {
//     this.loadLogs();
//   }

//   loadLogs() {
//     this.errorMessage = null; 

//     this.tablesService.getAuditLogs('', '').subscribe({
//       next: (res: AuditLog[]) => {
//         if (this.tableName) {
//           this.logs = res.filter(log => log.tableName.toLowerCase() === this.tableName.toLowerCase());
//         } else {
//           this.logs = res; 
//         }
//       },
//       error: (err) => {
//         console.error('Error loading logs', err);
//         this.errorMessage = err.error?.message || 'שגיאה בטעינת יומן הפעולות';
//       },
//     });
//   }

//   getFilteredLogs(): AuditLog[] {
//     let rows = this.logs;
//     const datePipe = new DatePipe('en-US'); 

//     if (this.filterValues.actionDate) {
//       const searchDate = this.filterValues.actionDate.toLowerCase();
      
//       rows = rows.filter(log => {
//         const formattedDate = datePipe.transform(log.actionDate, 'dd.MM.yyyy , HH:mm:ss') || '';
//         return formattedDate.toLowerCase().includes(searchDate);
//       });
//     }

//     if (this.filterValues.updateUser) {
//       const searchUser = this.filterValues.updateUser.toLowerCase();
//       rows = rows.filter(log => 
//         String(log.updateUser).toLowerCase().includes(searchUser)
//       );
//     }

//     return rows;
//   }

//   clearFilters() {
//     this.filterValues.updateUser = '';
//     this.filterValues.actionDate = '';
//   }

//   viewData(data: any) {
//     if (typeof data === 'string') {
//       try {
//         this.selectedLogData = JSON.parse(data);
//       } catch (e) {
//         this.selectedLogData = data;
//       }
//     } else {
//       this.selectedLogData = data;
//     }
//     console.log('נתוני שינוי:', this.selectedLogData);
//     alert(JSON.stringify(this.selectedLogData, null, 2));
//   }
// }