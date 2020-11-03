import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ProjectRequest, RequestComment, RequestStatusId, User, RequestLog, CommentFile, ProjectWorkflow } from '../../domainclasses';
import { RequestService } from '../../services/request.service';
import { CommonService } from '../../services/common.service';
import { UploadOutput, UploadInput, UploadFile, UploaderOptions } from 'ngx-uploader';
import { UploadStatus } from 'ngx-uploader';
import { OnChanges, SimpleChanges } from '@angular/core/src/metadata/lifecycle_hooks';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-newcomment',
  templateUrl: './newcomment.component.html',
  styleUrls: ['./newcomment.component.css']
})
export class NewcommentComponent implements OnInit, OnChanges {

  constructor(private requestService: RequestService,
    private commonService: CommonService,
    private userService: UserService
  ) { }

  @Input()
  requests: ProjectRequest[] = [];
  @Input()
  user: User;
  @Input()
  uploadLimit: number;
  comment: RequestComment = new RequestComment();
  @Output()
  onCreate = new EventEmitter<RequestLog>();
  @Output()
  onError = new EventEmitter<string>();
  uploadInput = new EventEmitter<UploadInput>();
  files: UploadFile[] = [];
  dragOver = false;
  uploadStatuses = Object.assign({}, UploadStatus);
  @Input()
  workflows: ProjectWorkflow[] = [];
  useRichEditor = true;

  textEditorInit = {
    menu: {
      edit: {title: 'Edit', items: 'undo redo | cut copy paste pastetext | selectall'},
      insert: {title: 'Insert', items: 'link media | template hr'},
      format: {title: 'Format', items: 'bold italic underline strikethrough superscript subscript | formats | removeformat'},
      table: {title: 'Table', items: 'inserttable tableprops deletetable | cell row column'},
      tools: {title: 'Tools', items: 'spellchecker code'}
    },
    toolbar: 'undo redo bold italic underline alignleft aligncenter alignright' +
            ' fontselect fontsizeselect cut copy paste numlist bullist link unlink',
    plugins: 'lists table link autoresize'
  };

  ngOnInit() {
    this.resetComment();
    this.useRichEditor = window.innerWidth >= 768;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.activeRequests().length > 0) {
      this.comment.request = this.activeRequests()[0];
    }
  }

  activeRequests(): ProjectRequest[] {
    return this.requests.filter(r => r.statusId !== RequestStatusId.RequestCancelled && r.statusId !== RequestStatusId.PassedExam)
    /*.sort((x, y) => x.dateCreated > y.dateCreated ? -1 : 1 )*/;
  }

  resetComment() {
    this.comment.files = [];
    this.comment.text = '';
    this.comment.statusChange = false;

  }


  removeFile(f) {
    const index = this.comment.files.findIndex(cf => cf.id === f.id );
    if (index >= 0) {
      this.comment.files.splice(index, 1);
      /*const event: UploadInput = {
        type: 'remove',
        id: f.id,
        file: f
      };
      this.uploadInput.emit(event);*/
    }
  }

  getDescription(r: ProjectRequest) {
    let description = (r.subject != null ? r.subject.name : r.subjectText) + ' (' + r.course.shortname + ')';
    if (this.user != null && this.user.isAdmin) {
      description += ', ' + r.createdBy.name + ' ' + r.createdBy.surname;
    }
    return description;
  }

  getFileUrl(f) {
    let url = this.requestService.getFileUrl(f);
    url += '&Authorization=' + encodeURIComponent(this.userService.getUserToken());
    return url;
  }

  showCheckBox(what: string): boolean {
    if (this.comment.request != null) {
        const s = this.comment.request.statusId;
        if (what === 'db') {
            return s === RequestStatusId.SubjectApproved;
        }
        if (what === 'code') {
          return s === RequestStatusId.DatabaseApproved;
        }
    }
    return false;
  }

  create() {
    const c: RequestComment = this.commonService.deepClone(this.comment);
    c.requestId = c.request.id;
    c.request = null;
    this.requestService.createComment(c).subscribe( log => {
      if (log.dateCreated != null) {
        log.dateCreated = new Date(log.dateCreated);
      }
      this.onCreate.emit(log);
      this.resetComment();
    },
    err => this.onError.emit(this.commonService.getError(err)) );
  }

  onUploadOutput(output: UploadOutput): void {
    if (output.type === 'allAddedToQueue') { // when all files added in queue
      this.files.forEach(f => {
        const event: UploadInput = {
          type: 'uploadFile',
          id: f.id,
          file: f,
          headers: {'Authorization' : this.userService.getUserToken()},
          url: this.requestService.getUploadUrl() + '?id=' + f.id,
          method: 'POST'
        };
        this.uploadInput.emit(event);
      });

    } else if (output.type === 'addedToQueue'  && typeof output.file !== 'undefined') { // add file to array when added
      this.files.push(output.file);
    } else if (output.type === 'uploading' && typeof output.file !== 'undefined') {
      // update current data in files array for uploading file
      const index = this.files.findIndex(file => typeof output.file !== 'undefined' && file.id === output.file.id);
      this.files[index] = output.file;
    } else if (output.type === 'removed') {
      // remove file from array when removed
      this.files = this.files.filter((file: UploadFile) => file !== output.file);
    } else if (output.type === 'dragOver') {
      this.dragOver = true;
    } else if (output.type === 'dragOut') {
      this.dragOver = false;
    } else if (output.type === 'drop') {
      this.dragOver = false;
    } else if (output.type === 'done') {
      const file = this.files.find(f => typeof output.file !== 'undefined' && f.id === output.file.id);
      if (file != null) {
        const cf = new CommentFile();
        cf.name = file.name;
        cf.file_id = file.id;
        this.comment.files.push(cf);
        if (this.files.find(f => f.progress.status !== UploadStatus.Done) == null) {
          const event: UploadInput = {
            type: 'removeAll'
          };
          this.uploadInput.emit(event);
          this.files = [];
        }
      }

    }
  }

  getStatusChangeText() {
    const row = this.workflows.find(w => w.courseId === this.comment.request.courseId && w.statusId === this.comment.request.statusId);
    if (row != null) {
      return row.requestStatusChangeText || '';
    }
    return '';
  }

  showChangeStatusCheckBox() {
    return this.getStatusChangeText().length > 0;
  }

}
