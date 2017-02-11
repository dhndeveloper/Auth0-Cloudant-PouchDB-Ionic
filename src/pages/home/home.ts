import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { NavController } from 'ionic-angular';

import { LoginSignUpPage } from '../login-sign-up/login-sign-up';

import { AuthenticationService } from "../../providers/authentication-service";
import { FriendService } from "../../providers/friend-service";
import { IFriend } from "../../providers/friend-service";
import { PouchDBService } from "../../providers/pouch-db-service";

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  public addForm: any;
  public friends: IFriend[];
  public user: string;

  constructor(
    public friendService: FriendService,
    public pouchdbService: PouchDBService,
    public formBuilder: FormBuilder,
    public auth: AuthenticationService,
    public navCtrl: NavController
  ) {

    //Prevent Blank Name Submissions

    this.addForm = formBuilder.group({
      name: ['', Validators.compose([Validators.minLength(3), Validators.required])],
    });

    if (this.auth.authenticated()) {

      // The user could be logged in already through their session token.
      // If they are then we have to setup their profile because they may not have gone through the Login methods

      this.auth.getUserProfile().then(profile => {

        this.pouchdbService.configureForUser(profile);
        this.loadFriends();

      });

    } else {
      this.friends = [];
    }

  } // end constructor


  public deleteFriend(friend: IFriend): void {

    this.friendService
      .deleteFriend(friend.id)
      .then(
      (): void => {

        this.loadFriends();

      },
      (error: Error): void => {

        console.log("Error:", error);

      });

  }

  // I process the "add" form, creating a new friend with the given name.
  public processAddForm(): void {

    if (!this.addForm.valid) {

    } else {

      this.friendService
        .addFriend(this.addForm.value.name)
        .then(
        (id: string): void => {

          console.log("New friend added:", id);

          this.loadFriends();
          this.addForm.value.name = "";

        },
        (error: Error): void => {

          console.log("Error:", error);

        }
        );
    }
  }

  public autoSync() {
    this.pouchdbService.autoSync();
  }

  public syncData(): void {

    console.info("Synchronizing remote database.");

    this.pouchdbService.sync()
      .then(
      (results): void => {

        // When we "sync" the two databases, documents may move in either
        // direction - Push or Pull. And, since this is performed using
        // "bulk" operations, it's possible that some of the documents will
        // create errors (version conflicts) while each overall request still
        // completes successfully.
        console.group("Remote sync completed.");
        console.log("Docs pulled:", results.pull.docs.length);
        console.log("Docs pushed:", results.push.docs.length);
        console.log("Errors:", (results.pull.errors.length + results.push.errors.length));
        console.groupEnd();

        // We don't really care if we PUSHED docs to the remote server; but,
        // if we PULLED new docs down, we'll want to re-render the list of
        // friends to display the newly acquired documents.
        if (results.pull.docs.length) {

          console.log(`Since we pulled ${results.pull.docs.length} docs, re-render friends.`);
          // this.loadFriends();

        }

        // Since replication / syncing is performed using bulk operations,
        // it's possible that some of the documents failed to replicate due
        // to version conflicts - warn for errors.
        if (results.pull.errors.length || results.push.errors.length) {

          console.warn("Some of the documents resulted in error:");
          console.log(results.pull.errors);
          console.log(results.push.errors);

        }

      },
      (error: any): void => {

        console.warn("Remote sync failed, critically.");
        console.error(error);

      });

  }

  // I log the current user out.
  public logout(): void {

    // When logging the user out, we want to teardown the currently configured
    // PouchDB database. This way, we can ensure that rogue asynchronous actions
    // aren't going to accidentally try to interact with the database.
    // --
    // CAUTION: For simplicity, this is in the app-component; but, it should probably
    // be encapsulated in some sort of "session" service.

    this.pouchdbService.teardown();
    this.navCtrl.setRoot(LoginSignUpPage);
    this.auth.logout();

    this.user = null;
    this.friends = [];

  }

  // ---
  // PRIVATE METHODS.
  // ---


  // I load the persisted friends collection into the list.
  private loadFriends(): void {

    this.friendService
      .getFriends()
      .then(
      (friends: IFriend[]): void => {

        // NOTE: Since the persistence layer is not returning the data
        // in any particular order, we're going to explicitly sort the
        // collection by name.
        this.friends = this.friendService.sortFriendsCollection(friends);

      },
      (error: Error): void => {

        console.log("Error", error);

      }
      );
  }

}
