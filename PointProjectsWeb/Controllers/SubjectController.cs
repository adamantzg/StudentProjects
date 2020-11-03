using PointProjectsWeb.Models.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace PointProjectsWeb.Controllers
{
    [OnlyAuthorized]
    public class SubjectController : BaseController
	{
		[Route("api/subject/get")]
		[HttpGet]
		public object getSubjects(bool freeOnly = false)
		{
            var user = CurrentUser;
			if (user.IsAdmin)
			{				
				var coursesId = user.AdministeredCourses.Select(c =>(int?) c.id).ToList();
				return uow.SubjectRepository.Get(s => s.createdById == user.id || s.approvedById == user.id || s.Courses.Any(c=> coursesId.Contains(c.id)),includeProperties: "CreatedBy,ApprovedBy,Requests, Courses").
					Select(s => GetUIObject(s));
			}
            else
            {
                var coursesId = user.EnrolledCourses.Select(c => (int?)c.id).ToList();
                var today = DateTime.Now;
                var requestCoursesIds = uow.RequestRepository.Get(r => r.createdById == user.id)
                    ?.Select(r => r.courseId).ToList();
                coursesId = coursesId.Where(c => requestCoursesIds?.Contains(c ?? 0) == false).ToList();
				var subjects = uow.SubjectRepository.Get(s => s.Courses.Any(c => coursesId.Contains(c.id)), includeProperties: "Requests, Courses").ToList();
                //TODO: Add custom subjects (from requests)
                var requestSubjects = uow.RequestRepository.Get(r => coursesId.Contains(r.courseId) && r.subjectId == null
                    && !(new[] { RequestStatus.RequestCreated, RequestStatus.SubjectWaitingApproval }.Contains(r.statusId))).GroupBy(r => r.subjectText).
                    Select(g => new Subject
                    {
                        name = g.Key,
                        description = g.First().comment,
                        createdById = g.First().createdById,
                        dateCreated = g.First().dateCreated,
                        approvedById = g.First().approvedById,
                        dateApproved = g.First().dateApproved,
                        Requests = g.ToList()
                    });
                return subjects.Union(requestSubjects).Select(GetUIObject);
            }				
			
		}

        private object GetUIObject(Subject s)
        {
            return new
            {
                s.id,
                s.name,
                s.description,
                s.createdById,
                createdBy = s.CreatedBy != null ?  new { s.CreatedBy.name, s.CreatedBy.surname } : null,
                dateCreated = Utilities.GetUserTime(s.dateCreated),
                s.approvedById,
                approvedBy = s.ApprovedBy != null ? new { s.ApprovedBy.name, s.ApprovedBy.surname } : null,
                dateApproved = Utilities.GetUserTime(s.dateApproved),
                requestCount = s.Requests?.Count(r => !(new[] { RequestStatus.PassedExam, RequestStatus.SubjectRejected, RequestStatus.RequestCancelled }.Contains(r.statusId))) ,
				approvedRequestCount = s.Requests?.Count(r=>!(new[] { RequestStatus.PassedExam, RequestStatus.RequestCreated,RequestStatus.SubjectWaitingApproval, RequestStatus.RequestCancelled }.Contains(r.statusId))),
                courses = s.Courses?.Select(c=> new { c.id, c.name, c.shortname })
            };
        }

        [Route("api/subject/create")]
        [HttpPost]
        public object Create(Subject subject)
        {
            HttpResponseMessage message = new HttpResponseMessage { StatusCode = HttpStatusCode.Unauthorized };
            if (CurrentUser.IsAdmin)
            {
                if (ValidateSubject(subject, out message))
                {
                    
                    subject.dateCreated = DateTime.UtcNow;
                    subject.createdById = CurrentUser.id;
                    subject.dateApproved = DateTime.UtcNow;
                    subject.approvedById = CurrentUser.id;
                    uow.SubjectRepository.Insert(subject);
                    uow.Save();
                    subject.CreatedBy = CurrentUser;
                    subject.ApprovedBy = CurrentUser;
                    return GetUIObject(subject);
                }
            }
            return message;
        }

        /*private object GetUIObject(Subject s)
        {
            return new
            {
                s.id,
                s.name,
                s.description,
                s.createdById,
                CreatedBy = s.CreatedBy != null ? new { s.CreatedBy.id, s.CreatedBy.name, s.CreatedBy.surname } : null,
                s.approvedById,
                s.dateCreated,
                ApprovedBy = s.ApprovedBy != null ? new { s.ApprovedBy.id, s.ApprovedBy.name, s.ApprovedBy.surname } : null,
                s.dateApproved,
                Courses = s.Courses?.Select(c => new { c.id, c.name, c.shortname })
            };
        }*/

        [Route("api/subject/update")]
        [HttpPost]
        public object UpdateSubject(Subject subject)
        {
            HttpResponseMessage message = new HttpResponseMessage { StatusCode = HttpStatusCode.Unauthorized };
            if (CurrentUser.IsAdmin)
            {
                if (ValidateSubject(subject, out message))
                {
                    var s = uow.SubjectRepository.Get(su=>su.id == subject.id,includeProperties: "CreatedBy, ApprovedBy").FirstOrDefault();
                    if (s != null)
                    {
                        uow.SubjectRepository.Update(subject);
                        uow.Save();
                    }
                    return GetUIObject(subject);
                }
            }
            return message;
        }

        [Route("api/subject/delete")]
        [HttpDelete]
        public object Delete(int id)
        {

            var requests = uow.RequestRepository.Get(r => r.subjectId == id).ToList();
            if (requests.Where(r=>r.statusId != RequestStatus.RequestCancelled).Count() > 0)
            {
                return new HttpResponseMessage { StatusCode = HttpStatusCode.BadRequest, Content = new StringContent("Tema ne može biti obrisana jer ima aktivnih prijava.") };
            }
            if(requests.Count > 0)
            {
                foreach (var r in requests)
                    uow.RequestRepository.Delete(r.id);
            }
            uow.SubjectRepository.Delete(id);
            uow.Save();
            return true;
        }

		[Route("api/subject/approve")]
		[HttpPost]
		public object Approve(int id)
		{
			var subject = uow.SubjectRepository.Get(s => s.id == id).FirstOrDefault();
			if(subject != null)
			{
				subject.approvedById = CurrentUser.id;				
				subject.dateApproved = DateTime.UtcNow;
				uow.Save();
				subject.ApprovedBy = CurrentUser;
				return GetUIObject(subject);
			}
			return null;
		}

		private bool ValidateSubject(Subject subject, out HttpResponseMessage message)
        {

            if (string.IsNullOrEmpty(subject.name))
            {
                message = new HttpResponseMessage { StatusCode = HttpStatusCode.BadRequest, Content = new StringContent("Naziv mora biti upisan.") };
                return false;
            }
            if (string.IsNullOrEmpty(subject.description))
            {
                message = new HttpResponseMessage { StatusCode = HttpStatusCode.BadRequest, Content = new StringContent("Opis mora biti upisan.") };
                return false;
            }          


            message = null;
            return true;
        }


    }
}
