import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login/login.component';
import { SinginComponent } from './singin/singin.component';
import { SingupComponent } from './singup/singup.component';



@NgModule({
  declarations: [
    LoginComponent,
    SinginComponent,
    SingupComponent
  ],
  imports: [
    CommonModule
  ]
})
export class AuthModule { }
