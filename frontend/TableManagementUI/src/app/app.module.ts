import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // חשוב מאוד עבור ngModel
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { TablesComponent } from './components/tables/tables.component';

@NgModule({
  declarations: [
    AppComponent,
    TablesComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule, 
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }