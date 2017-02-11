import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';

import { HomePage } from '../pages/home/home';
import { AuthloadingPage } from '../pages/authloading/authloading';
import { LoginSignUpPage } from '../pages/login-sign-up/login-sign-up';

import { PouchDBService } from '../providers/pouch-db-service';
import { FriendService } from '../providers/friend-service';
import { AuthenticationService } from '../providers/authentication-service';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    AuthloadingPage,
    LoginSignUpPage
  ],
  imports: [
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    AuthloadingPage,
    LoginSignUpPage
  ],
  providers: [{ provide: ErrorHandler, useClass: IonicErrorHandler }, PouchDBService, FriendService, AuthenticationService]
})
export class AppModule { }
