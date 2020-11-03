import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/authentication/login/login.component';
import { AuthGuard } from './services/auth-guard.service';
import { ForgotpassComponent } from './components/authentication/forgotpass/forgotpass.component';
import { PassrecoveryComponent } from './components/authentication/passrecovery/passrecovery.component';
import { UsersComponent } from './components/users/users.component';
import { AdminGuard } from './services/admin-guard.service';
import { UserComponent } from './components/users/user/user.component';
import { SubjectsComponent } from './components/subjects/subjects.component';
import { ExamListMode, ExamlistComponent } from './components/exams/examlist.component';
import { UserDataComponent } from './components/users/userdata/userdata.component';
import { RequestComponent } from './components/request/request.component';

const routes = [
  { path: '', component: HomeComponent, canActivate: [AuthGuard]},
  { path: 'login', component: LoginComponent},
  { path: 'forgotpass', component: ForgotpassComponent},
  { path: 'passrecovery/:data', component: PassrecoveryComponent},
  { path: 'users', component: UsersComponent, canActivate: [AuthGuard, AdminGuard]},
  { path: 'userdata', component: UserDataComponent, canActivate: [AuthGuard]},
  { path: 'subjects', component: SubjectsComponent, canActivate: [AuthGuard]},
  { path: 'exams', component: ExamlistComponent, canActivate: [AuthGuard, AdminGuard]},
  { path: 'request/:id', component: RequestComponent}
];

@NgModule({
  exports: [
    RouterModule
  ],
  imports: [
    RouterModule.forRoot(routes, {useHash: true})
  ],
  declarations: []
})
export class AppRoutingModule {

}
