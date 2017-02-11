import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { FormBuilder, Validators } from '@angular/forms';

import { HomePage } from "../home/home";

import { AuthenticationService } from "../../providers/authentication-service";
import { PouchDBService } from "../../providers/pouch-db-service";

import { ValidatorsCustom } from '../../validators/validators';


@Component({
  selector: 'page-login-sign-up',
  templateUrl: 'login-sign-up.html'
})

export class LoginSignUpPage {

  public loginForm: any;
  public loginSignUp: string = "login";
  public signUpForm: any;
  public submitAttempt: boolean = false;

  constructor(public navCtrl: NavController, public navParams: NavParams, public auth: AuthenticationService, public pouchdbService: PouchDBService, public formBuilder: FormBuilder) {

    //Auth0 requires more validators depending your Auth0 settings

    this.loginForm = formBuilder.group({
      email: ['', Validators.compose([Validators.required, ValidatorsCustom.isValid])],
      password: ['', Validators.compose([Validators.minLength(6), Validators.required])]
    });

    this.signUpForm = formBuilder.group({
      name: ['', Validators.compose([Validators.minLength(1), Validators.required])],
      email: ['', Validators.compose([Validators.required, ValidatorsCustom.isValid])],
      password: ['', Validators.compose([Validators.minLength(6), Validators.required])],
      confirmPassword: ['', Validators.compose([Validators.minLength(6), Validators.required])]
    }, { validator: ValidatorsCustom.matchingPasswords('password', 'confirmPassword') })

  }

  elementChanged(input) {
    let field = input.inputControl.name;
    this[field + "Changed"] = true;
  }

  public loginUser() {

    if (!this.loginForm.valid) {

    } else {

      this.auth.login(this.loginForm.value.email, this.loginForm.value.password).then((profile) => {

        // Once the user is logged in, the API will return the profile. We can use that to configure the user.
        // This will tear down any previous DB's and setup a new one. It will also configure the users remoteDB with the users app_meta data.
        this.pouchdbService.configureForUser(profile);

        // Send user to the HomePage where they can add/delete friends.
        this.navCtrl.setRoot(HomePage);

      });

    }

  }

  public signUpUser() {

    if (!this.signUpForm.valid) {

    } else {

      // Submit Attempt toggles the display of form validation errors
      this.submitAttempt = true;

      // Uses the Auth0 authentication api to sign up the user
      this.auth.signUp(this.signUpForm.value.email, this.signUpForm.value.password);

      //Once the user signs up, pass them to to login segment to login. Could modify to auto-login the user.
      this.loginSignUp = 'login';

    }

  }

}
