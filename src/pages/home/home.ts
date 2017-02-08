import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { NavController } from 'ionic-angular';

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

  constructor(
    public friendService: FriendService,
    public pouchdbService: PouchDBService,
    public formBuilder: FormBuilder
  ) {

    //Prevent Blank Name Submissions

    this.addForm = formBuilder.group({
      name: ['', Validators.compose([Validators.minLength(3), Validators.required])],
    });

    let profile = "Tutorial"

    this.pouchdbService.configureForUser(profile);
    this.loadFriends();

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
          this.addForm.reset();
          this.loadFriends();


        },
        (error: Error): void => {

          console.log("Error:", error);

        }
        );
    }
  }


  // I log the current user out.
  public logout(): void {


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
