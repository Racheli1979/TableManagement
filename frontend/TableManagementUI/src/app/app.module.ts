import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; 
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { TablesComponent } from './components/tables/tables.component';
import { ManageRecordModalComponent } from './components/manage-record-modal/manage-record-modal.component';
import { ReasonModalComponent } from './components/reason-modal/reason-modal.component';

@NgModule({
  declarations: [
    AppComponent,
    TablesComponent,
    ManageRecordModalComponent,
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