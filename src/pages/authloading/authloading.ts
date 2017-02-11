import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController } from 'ionic-angular';
import { LoginSignUpPage } from '../login-sign-up/login-sign-up';

import { AuthenticationService } from "../../providers/authentication-service";
import { HomePage } from "../home/home";


@Component({
  selector: 'page-authloading',
  templateUrl: 'authloading.html'
})
export class AuthloadingPage {

  constructor(public navCtrl: NavController, public navParams: NavParams, private loadingCtrl: LoadingController, public auth: AuthenticationService) {
    this.Authenticated();
  }

  Authenticated() {

    /// create a spinner that shows that we are checking authentication

    let loading = this.loadingCtrl.create({
      content: 'Authenticating...'
    });

    loading.present();

    this.auth.startupTokenRefresh().then((auth) => {

      // If the user is authenticated, dismiss the loader and push to the Home Page
      if (auth === true) {
        loading.dismiss();
        this.navCtrl.setRoot(HomePage);
      } else {

        // else send user to the Login Sign Up page.

        this.navCtrl.setRoot(LoginSignUpPage);
        loading.dismiss();
        console.log('not logged in')
      }
    });

  }

}
