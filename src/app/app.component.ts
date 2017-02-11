import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar, Splashscreen } from 'ionic-native';

import { AuthloadingPage } from '../pages/authloading/authloading';

import { AuthenticationService } from "../providers/authentication-service";


@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage = AuthloadingPage;

  constructor(platform: Platform, private auth: AuthenticationService) {

    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.styleDefault();
      Splashscreen.hide();

      auth.startupTokenRefresh();

    });
  }
}
