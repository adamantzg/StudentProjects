import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { Subject } from '../domainclasses';
import { Observable } from 'rxjs';
import { Settings } from '../settings';

@Injectable()
export class SubjectService {

  constructor(private httpService: HttpService) { }

  api = Settings.apiRoot + 'subject/';

  getSubjects(): Observable<Subject[]> {
    return this.httpService.get<Subject[]>(this.api + 'get', null);
  }

  updateSubject(s: Subject): Observable<Subject> {
    const url = s.id > 0 ? 'update' : 'create';
    return this.httpService.post<Subject>(this.api + url, s);
  }

  delete(id: number) {
    return this.httpService.delete(this.api + 'delete?id=' + id);
  }
}
