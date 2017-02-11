import { FormControl } from '@angular/forms';

export class ValidatorsCustom {

    static isValid(control: FormControl){

      var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(control.value);

      if (re){
        return null;
      }

      return {"invalidEmail": true};
    }

    static matchingPasswords(passwordKey: string, confirmPasswordKey: string) {
      return (group): {[key: string]: any} => {
        let password = group.controls[passwordKey];
        let confirmPassword = group.controls[confirmPasswordKey];

        if (password.value !== confirmPassword.value) {
          return {
            mismatchedPasswords: true
          };
        }
      }
    }

}
