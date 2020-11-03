using NLog;
using PointProjectsWeb.Models;
using PointProjectsWeb.Models.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Security.Cryptography;
using System.Web.Http;

namespace PointProjectsWeb.Controllers
{
    public enum CheckUserNameStatus
    {
        AlreadyHasSameName,
        Taken,
        Free
    }

    [OnlyAuthorized]
    public class UsersController : BaseController
    {
        [Route("api/user/getCurrent")]
        [HttpPost]
        public object GetCurrent()
        {
            var user =  GetCurrentUser();
            if (user != null)
                return GetUserUIObject(user);
            return new HttpResponseMessage { StatusCode = HttpStatusCode.Unauthorized };
        }

        [Route("api/user/getGroups")]
        [HttpGet]
        public object GetGroups(int userId)
        {
            var user = CurrentUser;
			if (user.IsAdmin)
				return uow.GroupRepository.Get(g => g.Users.Any(u => u.isAdmin == true && u.UserId == userId), includeProperties: "Users.User.EnrolledCourses").
					Select(g => new
					{
						g.id,
						g.name,
						users = g.Users.Where(u => u.UserId != userId).Select(u => new
						{
							u.User.id,
							u.UserId,
							u.User.name,
							u.User.surname,
							u.User.email,
							u.User.username,
							u.User.registrationCode,
							dateCreated = Utilities.GetUserTime(u.User.dateCreated),
                            dateCodeSent = Utilities.GetUserTime(u.User.dateCodeSent),
							enrolledCourses = u.User.EnrolledCourses.Select(GetCourseUIObject)
						})
					});					
				
            return new HttpResponseMessage(HttpStatusCode.Unauthorized);
        }

        [Route("api/user/create")]
        [HttpPost]
        public object CreateUser(User user)
        {
            HttpResponseMessage message = new HttpResponseMessage { StatusCode = HttpStatusCode.Unauthorized };
            
            if (CurrentUser.IsAdmin)
            {
                if (ValidateUser(user, out message))
                {
                    user.registrationCode = Guid.NewGuid().ToString();
                    user.dateCreated = DateTime.UtcNow;
                    uow.UserRepository.Insert(user);
                    uow.Save();
                    return user;
                }
            }            
            return message;
        }

        [Route("api/user/update")]
        [HttpPost]
        public object UpdateUser(User user)
        {
            HttpResponseMessage message = new HttpResponseMessage { StatusCode = HttpStatusCode.Unauthorized };
            if(CurrentUser.IsAdmin || CurrentUser.id == user.id)
            {
                if (ValidateUser(user, out message))
                {
                    var u = uow.UserRepository.GetByID(user.id);
                    if (u != null)
                    {
                        var text = $"User data for {user.username} successfully changed. Changed by: {CurrentUser.username} -  name={u.name}=>{user.name} surname={u.surname}=>{user.surname} email={u.email}=>{user.email} username={u.username}=>{user.username}";
                        u.name = user.name;
                        u.surname = user.surname;
                        u.email = user.email;
                        u.registrationCode = user.registrationCode;
                        u.username = user.username;
                        uow.Save();
                        Nlog.Log(LogLevel.Info, text);
                    }
                    
                    return user;
                }                
            }
            return message;
        }

        [Route("api/user/updatePassword")]
        [HttpPost]
        [AllowAnonymous]
        public object UpdatePassword(PasswordChange obj)
        {
            HttpResponseMessage message;
            try
            {
                if (ValidatePassword(obj, out message))
                {
                    /*int id = -1;
                    if (obj.id != null)
                    {
                        var sId = Utilities.Unprotect(obj.id);
                        int.TryParse(sId, out id);

                    }*/
                    int id = CurrentUser?.id ?? 0;

                    if(id == 0 && obj.code == null)
                    {
                        if (obj.id != null)
                        {
                            var sId = Utilities.Unprotect(obj.id);
                            int.TryParse(sId, out id);
                        }                        
                    }
                    
                    var user = id >0 ? uow.UserRepository.GetByID(id) : uow.UserRepository.Get(u => u.registrationCode == obj.code).FirstOrDefault();

                    if (user != null)
                    {
                        user.password = obj.password;
                        uow.Save();
                        Nlog.Log(LogLevel.Info, $"User {user?.username} successfully updated password.");
                        return obj;
                    }
                    return new HttpResponseMessage(HttpStatusCode.BadRequest);
                }
                return message;
            }
            catch (CryptographicException ex)
            {
                Nlog.Log(LogLevel.Error, ex, $"UpdatePassword. CurrentUser: {CurrentUser?.name} id: {obj.id}");
            }
            return new HttpResponseMessage { StatusCode = HttpStatusCode.BadRequest, Content = new StringContent("Greška u postavljanju lozinke.") };

        }

        [Route("api/user/sendCodes")]
        [HttpPost]
        public object SendCodes(IList<int> ids)
        {
            var users = uow.UserRepository.Get(u => ids.Contains(u.id)).ToList();
            var subject = "Portal za završne radove: Registracijski kod";
            var body = @"Vaš registracijski kod za portal je: {0}<br>Otvorite stranicu {1} i kliknite na Registracija.
                        Unesite kod u kućicu i kliknite na gumb Pošalji kod. <br>Ako ste unijeli točan kod, nakon toga ćete moći zadati lozinku i početi koristiti portal.
                        <br>Link na upute za korištenje portala:
                        <a href=""https://www.dropbox.com/s/ehft02s58fr2j71/Upute%20za%20portal%20za%20zavr%C5%A1ne%20radove.pdf?dl=0\"">Upute</a> ";
            var dateNow = DateTime.UtcNow;
            foreach (var u in users)
            {
                u.dateCodeSent = dateNow;
                Utilities.SendMail(u.email, subject, string.Format(body, u.registrationCode, $"{Utilities.GetSiteUrl()}"), CurrentUser.email);
            }
            uow.Save();
            return new
            {
                message = ids.Count > 1 ? "Kodovi su uspješno poslani." : "Kod je uspješno poslan",
                dateSent = Utilities.GetUserTime(dateNow)
            };
                        
        }

        [Route("api/user/checkusername")]
        [HttpPost]
        public object CheckUserName(string username, int? id = null)
        {

            var status = InternalCheckUserName(username, id);
            return GetCheckUsernameResponseMessage(status);                
        }

        [Route("api/user/generateCode")]
        [HttpGet]
        public object GenerateCode()
        {
            return Guid.NewGuid();
        }

		[Route("api/user/updateCourse")]
		[HttpPost]
		public void UpdateUserCourse(int userId, int courseId, bool remove)
		{
			var user = uow.UserRepository.Get(u => u.id == userId, includeProperties: "EnrolledCourses").First();
			var course = user.EnrolledCourses.FirstOrDefault(c => c.id == courseId);
			if (remove)
			{
				if (course != null)
					user.EnrolledCourses.Remove(course);
			}
			else
			{
				if (course == null)
					user.EnrolledCourses.Add(uow.CourseRepository.GetByID(courseId));
			}
			uow.Save();
		}

        [Route("api/user/delete")]
        [HttpDelete]
        public void DeleteUser(int id)
        {
            uow.UserRepository.Delete(id);
            uow.Save();
        }

		[Route("api/settings")]
		[HttpGet]
		public object GetSettings()
		{
			return new
			{
				uploadLimit = Properties.Settings.Default.UploadLimit
			};
		}

        private CheckUserNameStatus InternalCheckUserName(string username, int? id = null)
        {
            var user = uow.UserRepository.Get(u => u.username == username).FirstOrDefault();
            if (user != null)
            {
                if (user.id == id)
                    return CheckUserNameStatus.AlreadyHasSameName;
                else
                    return CheckUserNameStatus.Taken;
            }
            else
                return CheckUserNameStatus.Free;
        }

        private CheckUserNameStatus InternalCheckEmail(string email, int? id = null)
        {
            var user = uow.UserRepository.Get(u => u.email == email).FirstOrDefault();
            if (user != null)
            {
                if (user.id == id)
                    return CheckUserNameStatus.AlreadyHasSameName;
                else
                    return CheckUserNameStatus.Taken;
            }
            else
                return CheckUserNameStatus.Free;
        }

        private object GetCheckUsernameResponseMessage(CheckUserNameStatus status)
        {
            switch (status)
            {
                case CheckUserNameStatus.AlreadyHasSameName:
					return "Korisnik već ima to korisničko ime.";
                case CheckUserNameStatus.Taken:
                    return new HttpResponseMessage { StatusCode = HttpStatusCode.BadRequest, Content = new StringContent("Korisničko ime se već koristi.") };
                default:
                    return "Korisničko ime je slobodno.";
            }
        }

        private HttpResponseMessage GetCheckEmailResponseMessage(CheckUserNameStatus status)
        {
            switch (status)
            {
                case CheckUserNameStatus.AlreadyHasSameName:
                    return new HttpResponseMessage { StatusCode = HttpStatusCode.OK, Content = new StringContent("Korisnik već ima tu adresu.") };
                case CheckUserNameStatus.Taken:
                    return new HttpResponseMessage { StatusCode = HttpStatusCode.BadRequest, Content = new StringContent("Email se već koristi.") };
                default:
                    return new HttpResponseMessage { StatusCode = HttpStatusCode.OK, Content = new StringContent("Email je slobodan.") };
            }
        }

        private bool ValidateUser(User user, out HttpResponseMessage message)
        {
            
            if(string.IsNullOrEmpty(user.name))
            {
                message = new HttpResponseMessage { StatusCode = HttpStatusCode.BadRequest, Content = new StringContent("Ime mora biti upisano.") };
                return false;
            }
            if (string.IsNullOrEmpty(user.surname))
            {
                message = new HttpResponseMessage { StatusCode = HttpStatusCode.BadRequest, Content = new StringContent("Prezime mora biti upisano.") };
                return false;
            }
            if (string.IsNullOrEmpty(user.email))
            {
                message = new HttpResponseMessage { StatusCode = HttpStatusCode.BadRequest, Content = new StringContent("Email mora biti upisan.") };
                return false;
            }
            if (string.IsNullOrEmpty(user.username))
            {
                message = new HttpResponseMessage { StatusCode = HttpStatusCode.BadRequest, Content = new StringContent("Korisničko ime mora biti upisano.") };
                return false;
            }
            if(InternalCheckUserName(user.username, user.id) == CheckUserNameStatus.Taken)
            {
                message = (HttpResponseMessage) GetCheckUsernameResponseMessage(CheckUserNameStatus.Taken);
                return false;
            }
            if (InternalCheckEmail(user.email, user.id) == CheckUserNameStatus.Taken)
            {
                message = GetCheckEmailResponseMessage(CheckUserNameStatus.Taken);
                return false;
            }

            
            message = null;
            return true;
        }

        private bool ValidatePassword(PasswordChange obj, out HttpResponseMessage message)
        {
            if (string.IsNullOrEmpty(obj.password))
            {
                message = new HttpResponseMessage { StatusCode = HttpStatusCode.BadRequest, Content = new StringContent("Lozinka ne može biti prazna.") };
                return false;
            }
            if (obj.password != obj.password2)
            {
                message = new HttpResponseMessage { StatusCode = HttpStatusCode.BadRequest, Content = new StringContent("Lozinke se razlikuju.") };
                return false;
            }
            message = null;
            return true;
        }

        public static object GetUserUIObject(User user)
        {
            return new
            {
                user.id,
                user.username,
                user.name,
                user.surname,
                user.email,
                user.Token,
                isAdmin = user.Groups.Any(g => g.isAdmin == true),
                Groups = user.Groups.Select(g => new { g.UserId, g.GroupId, g.isAdmin }),
                administeredCourses = user.AdministeredCourses?.Select(GetCourseUIObject),
                enrolledCourses = user.EnrolledCourses?.Select(GetCourseUIObject),
                availableCourses = user.AvailableCourses?.Select(GetCourseUIObject)
            };
        }

        public static object GetCourseUIObject(Course c)
        {
            return new { c.id, c.name, c.shortname };
        }

    }
}
