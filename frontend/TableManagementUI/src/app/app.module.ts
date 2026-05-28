import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common'; 
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { TablesComponent } from './components/tables/tables.component';
import { TablesSidebarComponent } from './components/tables-sidebar/tables-sidebar.component'; 
import { TableGridComponent } from './components/tables-grid/tables-grid.component'; 
import { ManageRecordModalComponent } from './components/manage-record-modal/manage-record-modal.component';
import { ReasonModalComponent } from './components/reason-modal/reason-modal.component'; 
// import { AuditLogComponent } from './components/audit-log/audit-log.component';

@NgModule({
  declarations: [
    AppComponent,
    TablesComponent,
    TablesSidebarComponent, 
    TableGridComponent,    
    ManageRecordModalComponent,
    // AuditLogComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,  
    FormsModule,   
    HttpClientModule,
    ReasonModalComponent 
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }