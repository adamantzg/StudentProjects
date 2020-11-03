using PointProjectsWeb.Models.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Security.Cryptography;
using System.Web;
using System.Web.Http;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Web.Http.Cors;
using NLog;
using System.ServiceModel.Channels;

namespace PointProjectsWeb.Controllers
{
	
	public class AccountController : BaseController
    {
        [Route("api/register")]
        [HttpPost]
        public object Register(string registrationCode)
        {
            if(!string.IsNullOrEmpty(registrationCode))
            {
                var user = uow.UserRepository.Get(u => u.registrationCode == registrationCode).FirstOrDefault();
                if (user != null)
                {
                    if (!string.IsNullOrEmpty(user.password))
                        return new HttpResponseMessage { StatusCode = HttpStatusCode.BadRequest,Content = new StringContent("Već ste registrirani. Prijavite se sa korisničkim imenom i lozinkom.") };
                    else
                        return user;
                }                
            }
            return null;
        }

        [Route("api/login")]
        [HttpPost]
        public object Login(string username, string password)
        {
            var user = uow.UserRepository.Get(u => u.username == username && u.password == password, includeProperties: "Groups,AdministeredCourses,EnrolledCourses").FirstOrDefault();
            if(user != null)
            {
                var token = Guid.NewGuid();
                user.Token = Utilities.Protect(token.ToString(),"auth");
                user.Sessions = new List<UserSession>();
                user.Sessions.Add(new UserSession { DateCreated = DateTime.Now, Token = token });
                uow.Save();
                user.AvailableCourses = GetUserAvailableCourses(user);
                var u = UsersController.GetUserUIObject(user);
                Nlog.Log(LogLevel.Info, $"User {username} successfully logged in.");
                
                var userString = JsonConvert.SerializeObject(u);
                //HttpContext.Current.Response.Cookies.Add(new HttpCookie("pprojects_user_token", Utilities.Protect(token.ToString(), "cookie")));
                //HttpContext.Current.Response.Cookies.Add(new HttpCookie("pprojects_user", Utilities.Protect(userString, "cookie")));
                return u;
            }
            Nlog.Log(LogLevel.Info, $"Wrong username or password. User {username}, Pass: {password} Ip: {GetClientIp()}");
            return new HttpResponseMessage { StatusCode = HttpStatusCode.BadRequest, Content = new StringContent("Neispravno korisničko ime ili lozinka")};
        }

        [Route("api/testToken")]
        [HttpPost]
        public object TestToken(JObject data)
        {
            string encryptedToken = Convert.ToString(data.Value<string>("token"));
            var token = Utilities.Unprotect(encryptedToken, "cookie");
            if(token != null)
            {
                var gToken = Guid.Parse(token);
                var user = uow.UserRepository.Get(u => u.Sessions.Any(s => s.Token == gToken), includeProperties: "Groups,Sessions").FirstOrDefault();
                if(user != null)
                {
                    user.Sessions = null;
                    return UsersController.GetUserUIObject(user);
                }                
            }
            return null;            
        }

        

        [Route("api/recoveryLink")]
        [HttpPost]
        public object SendRecoveryLink(string email)
        {
            var user = uow.UserRepository.Get(u => u.email == email).FirstOrDefault();
            if(user == null)
                return new HttpResponseMessage { StatusCode = HttpStatusCode.BadRequest, Content = new StringContent("Email ne postoji u bazi korisnika.") };

            var encryptedId = Utilities.Protect(user.id.ToString());
            var link = Utilities.GetSiteUrl() + "/#/passrecovery/" + HttpUtility.UrlEncode(encryptedId);
            var body = $"<a href=\"{link}\">Kliknite da biste otvorili stranicu za promjenu lozinke.</a>";

            Nlog.Log(LogLevel.Info, $"User {email} requested recovery link.");

            Utilities.SendMail(email, "Postavljanje nove lozinke za Portal za završne radove", body);
            return $"Email s linkom za oporavak je poslan na adresu {email}.";
        }

        [Route("api/checkRecoveryCode")]
        [HttpPost]
        public object CheckRecoveryCode(dynamic data)
        {
            var encryptedId = data.data;
            
            try
            {
                if (encryptedId != null)
                {
                    var sId = Utilities.Unprotect(encryptedId.ToString());
                    int id;
                    if (int.TryParse(sId, out id))
                    {
                        var user = uow.UserRepository.GetByID(id);
                        if (user != null)
                            return new { user.id, user.username };
                    }
                }
            }
            catch (CryptographicException ex)
            {
                Nlog.Log(LogLevel.Error, ex, $"CheckRecoveryCode {data}");
            }
            Nlog.Log(LogLevel.Error, $"CheckRecoveryCode: recovery code error: {data}");
            return new HttpResponseMessage { StatusCode = HttpStatusCode.BadRequest, Content = new StringContent("Greška u kodu za oporavak.") };

        }

        private string GetClientIp(HttpRequestMessage request = null)
        {
            request = request ?? Request;

            if (request.Properties.ContainsKey("MS_HttpContext"))
            {
                return ((HttpContextWrapper)request.Properties["MS_HttpContext"]).Request.UserHostAddress;
            }
            else if (request.Properties.ContainsKey(RemoteEndpointMessageProperty.Name))
            {
                RemoteEndpointMessageProperty prop = (RemoteEndpointMessageProperty)request.Properties[RemoteEndpointMessageProperty.Name];
                return prop.Address;
            }
            else if (HttpContext.Current != null)
            {
                return HttpContext.Current.Request.UserHostAddress;
            }
            else
            {
                return null;
            }
        }


    }
}
