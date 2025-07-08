import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScriptComponent } from './script/script.component';



@NgModule({
  declarations: [
    ScriptComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class ScriptAreaModule { }
