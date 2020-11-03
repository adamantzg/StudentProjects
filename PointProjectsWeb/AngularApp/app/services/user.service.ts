import { Injectable, EventEmitter } from '@angular/core';
import { Settings } from '../settings';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PasswordChange } from '../modelclasses';
import { HttpService } from './http.service';
import { User, Group, Course } from '../domainclasses';


@Injectable()
export class UserService {


  constructor(private http: HttpClient, private httpService: HttpService) {
    this.userSetEvent = new EventEmitter();
  }

  public userSetEvent: EventEmitter<any>;
  private _user: User;
  get User(): User {
    if (this._user == null) {
      this._user = this.loadUser();
    }
    return this._user;
  }

  api = Settings.apiRoot + 'user/';
  userKey = 'pointprojects_user';
  tokenKey = 'pprojects_user_token';

  getCurrentUser(): Observable<User> {
    return this.http.post<User>(this.api + 'getCurrent', null).pipe(
      tap((u: any) => this.saveUser(u))
    );
  }

  updatePassword(data: PasswordChange) {
    return this.httpService.post<PasswordChange>(this.api + 'updatePassword', data);
  }

  loadUser(): User {
    const sUser = localStorage.getItem(this.userKey);
    if (sUser != null) {
      return JSON.parse(sUser);
    }
    return null;
  }

  getUserToken(): string {
    return localStorage.getItem(this.tokenKey);
  }

  saveUser(user: User) {
    this._user = user;
    localStorage.setItem(this.userKey, JSON.stringify(user));
    localStorage.setItem(this.tokenKey, user.token);
    this.userSetEvent.emit(user);
  }

  clearUser() {
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.tokenKey);
    this._user = null;
    this.userSetEvent.emit(null);
  }

  getGroups(userId: number): Observable<Group[]> {
    return this.httpService.get<Group[]>(this.api + 'getGroups', { params: {userId: userId}});
  }

  updateUser(user: User): Observable<User> {
    const url = user.id > 0 ? 'update' : 'create';
    return this.httpService.post<User>(this.api + url, user);
  }

  sendCodes(userIds: number[]) {
    return this.httpService.post(this.api + 'sendCodes', userIds);
  }

  checkUsername (id: number, username: string) {
    return this.httpService.post(this.api + 'checkusername?username=' + username + '&id=' + id, null);
  }

  updateUserCourse(userId: number, courseId: number, remove: boolean) {
    return this.httpService.postNoBlock(this.api + 'updateCourse?userId=' + userId + '&courseId=' + courseId + '&remove=' + remove, null);
  }

  addCourse(u: User, c: Course) {
    const co = u.availableCourses.find(cs => cs.id === c.id);
    if (co == null) {
        u.availableCourses.push(c);
    }
  }

  removeCourse(u: User, c: Course) {
    const index = u.availableCourses.findIndex(cs => cs.id === c.id);
    if (index >= 0) {
        u.availableCourses.splice(index, 1);
    }
  }

  generateCode() {
    return this.httpService.get(this.api + 'generateCode');
  }

  deleteUser(id: number) {
    return this.httpService.delete(this.api + 'delete?id=' + id);
  }
}
