import { Injectable } from '@angular/core';
import { Settings } from '../settings';
import { Observable, of } from 'rxjs';
import { ProjectRequest, RequestStatusId, RequestComment, CommentFile, RequestLog, RequestStatus } from '../domainclasses';
import { HttpService } from './http.service';
import { RequestsData, RequestData } from '../modelclasses';
// import { of } from 'rxjs/observable/of';
import { tap } from 'rxjs/operators';

@Injectable()
export class RequestService {

  constructor(private httpService: HttpService) { }

  api = Settings.apiRoot + 'request/';
  logTake = 50;
  statuses: RequestStatus[];

  getRequestsForCurrentUser(): Observable<RequestsData> {
    return this.httpService.get(this.api + 'getRequestsForCurrentUser', { params: {logTake: this.logTake}});
  }

  cancelRequest(requestId: number): Observable<RequestData> {
    return this.httpService.post(this.api + 'setStatus?statusId=' + RequestStatusId.RequestCancelled + '&requestId=' + requestId);
  }

  reactivateRequest(requestId: number): Observable<RequestData> {
    return this.httpService.post(this.api + 'setStatus?statusId=' + RequestStatusId.RequestReinstated + '&requestId=' + requestId);
  }

  setStatus(requestId: number, statusId: number, comment: string): Observable<RequestData> {
    let commentObj: RequestComment = null;
    if (comment != null && comment.length > 0) {
        commentObj = new RequestComment();
        commentObj.text = comment;
    }
    return this.httpService.post(this.api + 'setStatus?statusId=' + statusId + '&requestId=' + requestId, commentObj);
  }

  updateRequest(request: ProjectRequest): Observable<RequestData> {
    const url = request.id > 0 ? this.api + 'update' : this.api + 'create';
    return this.httpService.post(url, request);
  }

  approveRequest(request: ProjectRequest): Observable<RequestData> {
    return this.httpService.post(this.api + 'approve', request);
  }

  createComment(comment: RequestComment): Observable<RequestLog> {
    return this.httpService.post(this.api + 'createComment', comment);
  }

  getStatuses(): Observable<RequestStatus[]> {
      if (this.statuses != null) {
        return of(this.statuses);
      }
      const statuses = localStorage.getItem('statuses');
      if (statuses != null) {
        this.statuses = JSON.parse(statuses);
        return of(this.statuses);
      }
      return this.httpService.get(this.api + 'statuses').pipe(tap((data: any) => this.statuses = data));
  }

  getUploadUrl() {
      return this.api + 'upload';
  }

  getFileUrl(f: CommentFile) {
    if (f.file_id != null && f.file_id.length > 0) {
      return this.api + 'getTempUrl?file_id=' + f.file_id + '&name=' + encodeURIComponent(f.name);
    }
    return this.api + 'getFile?id=' + f.id;
  }

  getDatesFromJson(r: ProjectRequest) {
    if (r.dateCreated != null) {
      r.dateCreated = new Date(r.dateCreated);
    }
    if (r.dateClosed != null) {
      r.dateClosed = new Date(r.dateClosed);
    }
    if (r.dateApproved != null) {
      r.dateApproved = new Date(r.dateApproved);
    }
    if (r.dateDue != null) {
      r.dateDue = new Date(r.dateDue);
    }
    if (r.examDateTime != null) {
      r.examDateTime = new Date(r.examDateTime);
    }
  }

  getRequestsForIds(idList: number[]): Observable<RequestsData> {
    return this.httpService.get(this.api + 'getRequestsForIds', { params: {ids: idList.join(',')}});
  }

  /*getLogDatesFromJson(l: RequestLog) {
    if (l.dateCreated != null) {
      l.dateCreated = new Date(l.dateCreated);
    }
  }*/


}
