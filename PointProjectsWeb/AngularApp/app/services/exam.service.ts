import { Injectable } from '@angular/core';
import { Settings } from '../settings';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';
import { Exam } from '../domainclasses';
import { ExamData } from '../modelclasses';

@Injectable()
export class ExamService {

  constructor(private httpService: HttpService) { }

  api = Settings.apiRoot + 'exam/';

  getForCurrentUser(): Observable<Exam[]> {
    return this.httpService.get(this.api);
  }

  createOrUpdate(e: Exam): Observable<Exam> {
    const api = this.api + (e.id > 0 ?  'update' : 'create');
    return this.httpService.post(api, e);
  }

  getExam(id: number) {
      return this.httpService.get(this.api + 'getById?id=' + id);
  }

  deleteExam(id: number) {
    return this.httpService.post(this.api + 'delete?id=' + id);
  }

  apply(id: number): Observable<ExamData> {
    return this.httpService.post(this.api + 'apply?examId=' + id);
  }

  cancelExam(requestId: number): Observable<ExamData> {
    return this.httpService.post(this.api + 'cancel?requestId=' + requestId);
  }

  getDatesFromJson(e: Exam) {
    if (e.dateCreated != null) {
      e.dateCreated = new Date(e.dateCreated);
    }
    if (e.examDateTime != null) {
      e.examDateTime = new Date(e.examDateTime);
    }
    if (e.requests != null) {
      e.requests.forEach(r => {
        if (r.dateApplied != null) {
          r.dateApplied = new Date(r.dateApplied);
        }
        if (r.dateCancelled != null) {
          r.dateCancelled = new Date(r.dateCancelled);
        }
      });
    }
  }

}
