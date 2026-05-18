import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; 
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { TablesComponent } from './components/tables/tables.component';
import { ManageRecordModalComponent } from './components/manage-record-modal/manage-record-modal.component';
import { ReasonModalComponent } from './components/reason-modal/reason-modal.component';
// import { AuditLogComponent } from './components/audit-log/audit-log.component';

@NgModule({
  declarations: [
    AppComponent,
    TablesComponent,
    ManageRecordModalComponent,
    // AuditLogComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule, 
    HttpClientModule,
    ReasonModalComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }