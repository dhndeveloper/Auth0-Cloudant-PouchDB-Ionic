import { Storage } from '@ionic/storage';
import { JwtHelper, tokenNotExpired } from 'angular2-jwt';
import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import { Auth0Vars } from '../auth0-variables';
import { Http, Headers } from '@angular/http';

declare var Auth0: any;

@Injectable()
export class AuthenticationService {

  jwtHelper: JwtHelper = new JwtHelper();
  auth0 = new Auth0({ clientID: Auth0Vars.AUTH0_CLIENT_ID, domain: Auth0Vars.AUTH0_DOMAIN });
  storage: Storage = new Storage();
  refreshSubscription: any;
  user: Object;
  zoneImpl: NgZone;
  idToken: string;
  authenticationCheck: boolean = false;

  constructor(zone: NgZone, private http: Http) {

    this.zoneImpl = zone;

    this.storage.get('profile').then(profile => {
      this.user = JSON.parse(profile);
    }).catch(error => {
      console.log(error);
    });

  }

  public authenticated() {

    //Check if the token is expired. This returns a boolean.
    return tokenNotExpired('id_token', this.idToken);
  }

  public login(username, password): Promise<any> {

    return new Promise((resolve, reject) => {

      let headers = new Headers();
      headers.append('Content-Type', 'application/json');

      let credentials = {
        client_id: Auth0Vars.AUTH0_CLIENT_ID,
        username: username,
        password: password,
        connection: "Username-Password-Authentication",
        scope: 'openid offline_access',
        device: 'Mobile device' //stats recorded on dash where user logged in
      }

      this.http.post('https://DOMAIN.auth0.com/oauth/ro', JSON.stringify(credentials), { headers: headers })
        .subscribe((res): any => {

          let authResult = res.json();

          //Set the idToken to be used in the rest of the service
          this.idToken = authResult.id_token;

          //Save the token and refresh token so the user does not have to log back in when the app refreshes.
          this.storage.set('id_token', authResult.id_token);
          this.storage.set('refresh_token', authResult.refresh_token);

          // Once the user is loggedin, go get the profile and return it back so we can configure the users pouchdb in the login-sign-up component
          this.getUserProfile().then((profile) => {
            resolve(profile);
          });

          // For Demo purpoes, show that we are getting users user_metadata from Auth0
          console.log(res.json());

        }, (err) => {
          reject(err);
          console.log(err);
        });

    }); // end promise

  }

  public getUserProfile(): Promise<any> {

    //Get the users token information which contains their profile data. This will contain information about their couchdb/cloudant db.

    return new Promise((resolve, reject) => {

      let headers = new Headers();
      headers.append('Content-Type', 'application/json');

      let token = {
        id_token: this.idToken
      }

      this.http.post('https://DOMAIN.auth0.com/tokeninfo', JSON.stringify(token), { headers: headers })
        .subscribe(res => {

          let profile = res.json();

          profile.user_metadata = profile.user_metadata || {};
          this.storage.set('profile', JSON.stringify(profile));
          this.user = profile;

          resolve(this.user);

          console.log(this.user);

          this.zoneImpl.run(() => this.user = profile);
          this.scheduleRefresh();

        }, (err) => {
          console.log(err);
        });

    });

  }

  public signUp(email, password) {

    let headers = new Headers();
    headers.append('Content-Type', 'application/json');

    let credentials = {
      client_id: Auth0Vars.AUTH0_CLIENT_ID,
      email: email,
      password: password,
      connection: "Username-Password-Authentication"
    }

    this.http.post('https://DOMAIN.auth0.com/dbconnections/signup', JSON.stringify(credentials), { headers: headers })
      .subscribe((res): any => {

        //For demo purpoes, show that the sign up was successful and the data we can work with.
        console.log(res.json());

      }, (err) => {
        console.log(err);
      });

  }

  public logout() {

    // Remove all data related to the user that is stored locally.
    this.storage.remove('profile');
    this.storage.remove('id_token');
    this.idToken = null;
    this.storage.remove('refresh_token');
    this.zoneImpl.run(() => this.user = null);
    // Unschedule the token refresh
    this.unscheduleRefresh();
  }

  public scheduleRefresh() {
    // If the user is authenticated, use the token stream
    // provided by angular2-jwt and flatMap the token

    let source = Observable.of(this.idToken).flatMap(
      token => {
        // The delay to generate in this case is the difference
        // between the expiry time and the issued at time
        let jwtIat = this.jwtHelper.decodeToken(token).iat;
        let jwtExp = this.jwtHelper.decodeToken(token).exp;
        let iat = new Date(0);
        let exp = new Date(0);

        let delay = (exp.setUTCSeconds(jwtExp) - iat.setUTCSeconds(jwtIat));

        return Observable.interval(delay);
      });

    this.refreshSubscription = source.subscribe(() => {
      this.getNewJwt();
    });
  }

  public startupTokenRefresh(): Promise<any> {

    return new Promise((resolve, reject) => {

      this.storage.get('id_token').then(token => {

        this.idToken = token;

        // If the user is authenticated, use the token stream
        // provided by angular2-jwt and flatMap the token
        if (this.authenticated()) {
          let source = Observable.of(this.idToken).flatMap(
            token => {
              this.authenticationCheck = true;
              // Get the expiry time to generate
              // a delay in milliseconds
              let now: number = new Date().valueOf();
              let jwtExp: number = this.jwtHelper.decodeToken(token).exp;
              let exp: Date = new Date(0);
              exp.setUTCSeconds(jwtExp);
              let delay: number = exp.valueOf() - now;

              // Use the delay in a timer to
              // run the refresh at the proper time

              resolve(this.authenticationCheck);

              return Observable.timer(delay);

            });

          // Once the delay time from above is
          // reached, get a new JWT and schedule
          // additional refreshes
          source.subscribe(() => {
            this.getNewJwt();
            this.scheduleRefresh();
          });
        } else {
          this.authenticationCheck = false;
          resolve(this.authenticationCheck);

        }

      });

    });

  }

  public unscheduleRefresh() {
    // Unsubscribe fromt the refresh
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  public getNewJwt() {
    // Get a new JWT from Auth0 using the refresh token saved
    // in local storage
    this.storage.get('refresh_token').then(token => {
      this.auth0.refreshToken(token, (err, delegationRequest) => {
        if (err) {
          alert(err);
        }
        this.storage.set('id_token', delegationRequest.id_token);
        this.idToken = delegationRequest.id_token;
      });
    }).catch(error => {
      console.log(error);
    });

  }

}
