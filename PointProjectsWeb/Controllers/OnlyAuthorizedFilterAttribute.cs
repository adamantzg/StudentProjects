using PointProjectsWeb.Models;
using PointProjectsWeb.Models.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web;
using System.Web.Http;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;

namespace PointProjectsWeb
{
    public class OnlyAuthorizedAttribute : AuthorizationFilterAttribute
    {
		
      public override void OnAuthorization(HttpActionContext actionContext)
      {
		    var user = Utilities.GetCurrentUser();
		    if (user == null)
			    user = GetUserFromToken(Utilities.GetTokenFromRequest(actionContext.Request));
		    if (user != null || actionContext.ActionDescriptor.GetCustomAttributes<AllowAnonymousAttribute>().Count > 0)
                  base.OnAuthorization(actionContext);
              else
                  actionContext.Response = new HttpResponseMessage { StatusCode = HttpStatusCode.Unauthorized, Content = new StringContent("Niste autorizirani za pristup.") };
      }



		protected User GetUserFromToken(string encryptedToken)
		{
            if (encryptedToken == null)
                return null;
			using (var uow = new UnitOfWork())
			{
				var token = Utilities.Unprotect(encryptedToken, "auth");
				if (token != null)
				{
					var gToken = Guid.Parse(token);
					var user = uow.UserRepository.Get(u => u.Sessions.Any(s => s.Token == gToken), includeProperties: "Groups,Sessions").FirstOrDefault();
					if (user != null)
					{
						return user;
					}
				}
				return null;
			}
			
		}

		
	}
}
