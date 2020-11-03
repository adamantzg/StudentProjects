using NLog;
using PointProjectsWeb.Models;
using PointProjectsWeb.Models.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Mail;
using System.Web;
using System.Web.Http;
using System.Web.Http.Filters;

namespace PointProjectsWeb.Controllers
{
    public class BaseController : ApiController
    {
        protected UnitOfWork uow = new UnitOfWork();
        protected Logger Nlog = LogManager.GetCurrentClassLogger();

        protected User CurrentUser
        {
            get
            {
                return GetCurrentUser();
            }
        }

		protected User GetUserFromToken(string encryptedToken)
		{
			
			var token = Utilities.Unprotect(encryptedToken, "auth");
			if (token != null)
			{
				var gToken = Guid.Parse(token);
				var user = uow.UserRepository.Get(u => u.Sessions.Any(s => s.Token == gToken), includeProperties: "Groups,Sessions, AdministeredCourses, EnrolledCourses").FirstOrDefault();
                if (user != null)
                {
                    user.AvailableCourses = GetUserAvailableCourses(user);
                    return user;
                }
			}
			return null;			
		}

        protected List<Course> GetUserAvailableCourses(User user)
        {
            var statuses = new[] { (int?)RequestStatus.SubjectRejected, (int?)RequestStatus.RequestCancelled };
            var takenCoursesIds = uow.RequestRepository.Get(r => r.createdById == user.id && !statuses.Contains(r.statusId)).Select(r => r.courseId).ToList();
            return user.EnrolledCourses.Where(c => !takenCoursesIds.Contains(c.id)).ToList();
        }

        protected User GetCurrentUser()
		{
			var token = Utilities.GetTokenFromRequest(HttpContext.Current.Items["MS_HttpRequestMessage"] as HttpRequestMessage);
			if (token != null)
				return GetUserFromToken(token); 
			return null;
		}

		protected override void Dispose(bool disposing)
		{
			uow.Dispose();
			uow = null;
			base.Dispose(disposing);
		}

        protected void SendMailForRequest(ProjectRequest request, string subject, string body = "", bool toAdmin = true, bool toUser = false, IList<CommentFile> files = null)
        {
            var course = uow.CourseRepository.Get(c => c.id == request.courseId, includeProperties: "Administrator").FirstOrDefault();
            subject = subject.Replace("#course#", course.name);
            body = body.Replace("#course#", course.name);
            if (toAdmin)
            {
                if (course != null && course.Administrator != null && course.Administrator.email != null)
                {
                    Utilities.SendMail(course.Administrator.email, subject, body,
                        attachments: files != null ? files.Select(f => new Attachment(Utilities.BytesToStream(f.data), f.name, "application/octet-stream")).ToList() : null);
                }
            }
            else
            {
                if (request.CreatedBy != null && request.CreatedBy.email != null)
                    Utilities.SendMail(request.CreatedBy.email, subject, body);
            }

        }
    }

	//public class AllowCrossSiteJsonAttribute : ActionFilterAttribute
	//{
	//	public override void OnActionExecuted(HttpActionExecutedContext actionExecutedContext)
	//	{
	//		if (actionExecutedContext.Response != null)
	//			actionExecutedContext.Response.Headers.Add("Access-Control-Allow-Origin", "*");

	//		base.OnActionExecuted(actionExecutedContext);
	//	}
	//}
}
