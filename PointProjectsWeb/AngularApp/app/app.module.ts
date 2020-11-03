import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HomeComponent } from './components/home/home.component';
import { UserComponent } from './components/users/user/user.component';
import { SubjectComponent } from './components/subjects/subject/subject.component';
import { LoginComponent } from './components/authentication/login/login.component';
import { TabsModule } from 'ngx-bootstrap/tabs';
import {HttpClientModule} from '@angular/common/http';
import { CommonService } from './services/common.service';
import { ForgotpassComponent } from './components/authentication/forgotpass/forgotpass.component';
import { AuthGuard } from './services/auth-guard.service';
import { UserService } from './services/user.service';
import { AccountService } from './services/account.service';
import { PassrecoveryComponent } from './components/authentication/passrecovery/passrecovery.component';
import { HttpService } from './services/http.service';
import { BlockUIService } from './services/block-ui.service';
import { UsersComponent } from './components/users/users.component';
import { OrderModule } from 'ngx-order-pipe';
import { AdminGuard } from './services/admin-guard.service';
import { ModalModule, ProgressbarModule } from 'ngx-bootstrap';
import { UsermodalComponent } from './components/users/user/usermodal.component';
import { SubjectsComponent } from './components/subjects/subjects.component';
import { ShortenedTextComponent } from './components/common/shortened-text/shortened-text.component';
import { SubjectService } from './services/subject.service';
import { SubjectmodalComponent } from './components/subjects/subject/subjectmodal.component';
import { RequestListComponent } from './components/requests/request-list.component';
import { RequestService } from './services/request.service';
import { MessageboxComponent } from './components/common/messagebox/messagebox.component';
import { RequestEditComponent } from './components/requests/request-edit/request-edit.component';
import { RequestEditmodalComponent } from './components/requests/request-edit/request-editmodal.component';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { MessageboxService } from './components/common/messagebox/messagebox.service';
import { ActivitiesComponent } from './components/activities/activities.component';
import { CollapsiblePanelDirective } from './directives/collapsible-panel.directive';
import { ChangesubjectmodalComponent } from './components/requests/changesubject/changesubjectmodal.component';
import { NewcommentComponent } from './components/newcomment/newcomment.component';
import { NgUploaderModule} from 'ngx-uploader';
import { ApproveModalComponent } from './components/requests/approve/approvemodal.component';
import { defineLocale } from 'ngx-bootstrap/chronos';
import { enGbLocale } from 'ngx-bootstrap/locale';
import { ExamService } from './services/exam.service';
import { ExamlistComponent } from './components/exams/examlist.component';
import { ExameditComponent } from './components/exams/examedit.component';
import { ExameditmodalComponent } from './components/exams/exameditmodal.component';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { UserDataComponent } from './components/users/userdata/userdata.component';
import { EditorModule } from '@tinymce/tinymce-angular';
import { RequestComponent } from './components/request/request.component';

// defineLocale('enGb', enGb);


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    UserComponent,
    SubjectComponent,
    LoginComponent,
    ForgotpassComponent,
    PassrecoveryComponent,
    UsersComponent,
    UsermodalComponent,
    SubjectsComponent,
    ShortenedTextComponent,
    SubjectmodalComponent,
    RequestListComponent,
    MessageboxComponent,
    RequestEditComponent,
    RequestEditmodalComponent,
    ActivitiesComponent,
    CollapsiblePanelDirective,
    ChangesubjectmodalComponent,
    NewcommentComponent,
    ApproveModalComponent,
    ExamlistComponent,
    ExameditComponent,
    ExameditmodalComponent,
    UserDataComponent,
    RequestComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    TabsModule.forRoot(),
    HttpClientModule,
    FormsModule,
    OrderModule,
    ModalModule.forRoot(),
    BsDatepickerModule.forRoot(),
    NgUploaderModule,
    ProgressbarModule.forRoot(),
    TimepickerModule.forRoot(),
    EditorModule
  ],
  providers: [CommonService, AuthGuard, UserService, AccountService, HttpService,
    BlockUIService, AdminGuard, SubjectService, RequestService, MessageboxService, ExamService],
  bootstrap: [AppComponent],
  entryComponents: [UsermodalComponent, SubjectmodalComponent, MessageboxComponent,
    RequestEditmodalComponent, ChangesubjectmodalComponent, ApproveModalComponent, ExameditmodalComponent]
})
export class AppModule { }
