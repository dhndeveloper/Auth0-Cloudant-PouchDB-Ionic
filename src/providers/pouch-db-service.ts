import { Injectable } from '@angular/core';

import PouchDB from 'pouchdb';

@Injectable()

export class PouchDBService {

  private pendingSync: Promise<any>;
  private localDatabase: any;
  private remoteDatabase: any;


  constructor() {

    this.localDatabase = null;
    this.pendingSync = null;
    this.remoteDatabase = null;

  }

  // ---
  // PUBLIC METHODS.
  // ---


  public configureForUser(profile): void {

    this.localDatabase = new PouchDB(this.getDatabaseName(profile), { adapter: 'websql' });

    this.remoteDatabase = `https://${profile.couchDB.key}:${profile.couchDB.password}@CLOUDANT_HOST_NAME/${profile.couchDB.name}`;

    this.localDatabase.info().then((info) => {

      // If you want autosync by default, uncomment this out.

      // this.autoSync();
    });


  }

  // I get the active PouchDB instance. Throws an error if no PouchDB instance is
  // available (ie, user has not yet been configured with call to .configureForUser()).
  public getDB(): any {

    if (!this.localDatabase) {

      throw (new Error("Database is not available - please configure an instance."));

    }

    return (this.localDatabase);

  }

  // I teardown / deconfigure the existing database instance (if there is one).
  // --
  // CAUTION: Subsequent calls to .getDB() will fail until a new instance is configured
  // with a call to .configureForUser().
  public teardown(): void {

    if (!this.localDatabase) {

      return;

    }

    // TODO: Stop remote replication for existing database (not needed for this demo).

    this.localDatabase.close();
    this.localDatabase = null;

  }

  // ---
  // PRIVATE METHODS.
  // ---

  // I return a normalized database name for the given user identifier.
  private getDatabaseName(profile: any): string {

    // Database naming restrictions from https://wiki.apache.org/couchdb/HTTP_database_API
    // --
    // A database must be named with all lowercase letters (a-z), digits (0-9), or
    // any of the _$()+-/ characters and must end with a slash in the URL. The name
    // has to start with a lowercase letter (a-z)... Uppercase characters are NOT
    // ALLOWED in database names.
    let dbName = profile.email
      .toLowerCase()
      .split('@')[0];
    ;

    return (dbName);

  }

  public autoSync() {

    //this turns on continous replication

    let options = {
      live: true,
      retry: true,
      continuous: true
    }

    this.localDatabase.sync(this.remoteDatabase, options);

  }


  public sync(): Promise<any> {

    // If there's already a sync operation in progress, just return the pending
    // Promise. This will provide light throttling of sync requests.
    if (this.pendingSync) {

      return (this.pendingSync);

    }

    let promise = this.pendingSync = new Promise(
      (resolve, reject): void => {

        let result = {
          pull: {
            docs: [],
            errors: []
          },
          push: {
            docs: [],
            errors: []
          }
        };

        this.localDatabase.sync(this.remoteDatabase)
          // A change event is emitted for each direction - one for "push" and
          // one for "pull"; but, only if there are changes for that direction.
          // We want to aggregate the change events, so when each one happens,
          // we'll just overwrite the "direction" results.
          .on(
          "change",
          (eventValue): void => {

            result[eventValue.direction].docs = eventValue.change.docs;
            result[eventValue.direction].errors = eventValue.change.errors;

          }
          )
          // The complete event just shows some overall stats about the sync
          // operation that could have been deduced, in part, by the various
          // "change" events that were fired.
          .on(
          "complete",
          (eventValue): void => {

            // We don't actually need any of the data from the completed
            // event - it just signified that the result has been fully
            // populated.
            resolve(result);

            // Once the sync operation has completed, clear out the
            // pending promise. This won't affect the out-of-scope
            // references to it; but, it will allow new sync operations
            // to be initiated.
            this.pendingSync = null;

          }
          )
          // An error event signifies a critical error - not a document-level
          // problem in the bulk operations.
          .on(
          "error",
          (eventValue: any): void => {

            reject(eventValue);

            // Allow new sync operations to be initiated.
            this.pendingSync = null;

          }
          )
          ;

      }
    );

    return (promise);

  }


}
