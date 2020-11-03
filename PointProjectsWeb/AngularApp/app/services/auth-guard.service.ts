import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { UserService } from './user.service';
import { RouterStateSnapshot, Router } from '@angular/router/';


@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private userService: UserService, private router: Router) {

  }

  canActivate() {
    if (this.userService.User != null) {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }
}
