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
	public class ExamController : BaseController
	{
		[Route("api/exam")]
		[HttpGet]
		public object GetForCurrentUser(bool pending = true)
		{
			var today = DateTime.UtcNow;
			List<int?> courseIdsList = null;
			if (CurrentUser?.IsAdmin == true)
			{
				courseIdsList = CurrentUser.AdministeredCourses.Select(c => (int?)c.id).ToList();
			}
			else
			{
				var requests = uow.RequestRepository.Get(r => r.createdById == CurrentUser.id && r.statusId == RequestStatus.CodeApprovedPendingExam).ToList();
				if (requests.Count > 0)
				{
					courseIdsList = requests.Select(r => (int?)r.courseId).Distinct().ToList();
				}
			}
			var exams = uow.ExamRepository.Get(e => courseIdsList.Contains(e.courseId) && (pending == false || e.examDateTime > today), includeProperties: "CreatedBy, Course,Requests.Request"
				).ToList();
			if (CurrentUser?.IsAdmin == false)
				exams = exams.Where(e => !e.Requests.Any(r => r.Request?.createdById == CurrentUser.id && (r.dateCancelled == null || r.dateCancelled < r.dateApplied))).ToList();
			return exams.Select(e => GetUIObject(e));
		}

		[Route("api/exam/getById")]
		[HttpGet]
		public object GetById(int id)
		{
			var exam = uow.ExamRepository.Get(e => e.id == id, includeProperties: "Requests.Request.CreatedBy, Requests.Request.Subject").FirstOrDefault();
			if (exam != null)
				return GetUIObject(exam);
			return null;
		}

		[Route("api/exam/create")]
		[HttpPost]
		public object Create(Exam e)
		{
			e.examDateTime = e.examDateTime?.ToUniversalTime();
			e.createdById = CurrentUser.id;
			e.dateCreated = DateTime.UtcNow;
			uow.ExamRepository.Insert(e);
			uow.Save();
			uow.ExamRepository.LoadReference(e, "Course");
			e.CreatedBy = CurrentUser;
			return GetUIObject(e);
		}

		[Route("api/exam/update")]
		[HttpPost]
		public object Update(Exam e)
		{
			uow.ExamRepository.Update(e);
			uow.Save();
			uow.ExamRepository.LoadReference(e, "Course");
			uow.ExamRepository.LoadReference(e, "CreatedBy");
			return GetUIObject(e);
		}

		[Route("api/exam/delete")]
		[HttpPost]
		public object Delete(int id)
		{
			uow.ExamRepository.DeleteByIds(new[] { id });
			return id;
		}

		[Route("api/exam/createExamRequest")]
		[HttpPost]
		public object CreateEr(ExamRequest er)
		{
			var exam = uow.ExamRepository.Get(e => e.id == er.examId, includeProperties: "Requests").FirstOrDefault();
			if (exam != null)
			{
				er.dateApplied = DateTime.UtcNow;
				exam.Requests.Add(er);
				uow.Save();

			}
			return GetUIObject(exam);
		}

		[Route("api/exam/apply")]
		[HttpPost]
		public object Apply(int examId)
		{
            var userid = CurrentUser.id;
            
			var exam = uow.ExamRepository.Get(e => e.id == examId, includeProperties: "Requests").FirstOrDefault();
            if(exam != null)
            {
                var existing = uow.ExamRepository.Get(e => e.Requests.Any(r => r.Request.statusId != RequestStatus.PassedExam && r.Request.courseId == exam.courseId &&
                                    r.Request.createdById == userid && (r.dateCancelled == null || r.dateApplied > r.dateCancelled)),
                includeProperties: "Requests.Request").ToList();
                if(existing.Count > 0 && existing.Count(e=>e.id != examId) > 0)
                {
                    return new HttpResponseMessage { StatusCode = HttpStatusCode.BadRequest, Content = new StringContent("Već ste prijavljeni na drugi ispit iz ovog predmeta.") };
                }
                var request = uow.RequestRepository.Get(r => r.createdById == CurrentUser.id && r.courseId == exam.courseId && r.statusId == RequestStatus.CodeApprovedPendingExam, includeProperties: "Course").FirstOrDefault();
                if(request != null)
                {
                    request.statusId = RequestStatus.ExamTimeSlotDecided;

                    var er = exam.Requests.FirstOrDefault(r => r.requestId == request.id);
                    if (er == null)
                    {
                        er = new ExamRequest { examId = examId, requestId = request.id, dateApplied = DateTime.UtcNow };
                        exam.Requests.Add(er);
                    }                        
                    else
                        er.dateApplied = DateTime.UtcNow;                    

                    var log = new RequestLog
                    {
                        createdById = CurrentUser.id,
                        dateCreated = DateTime.UtcNow,
                        requestId = request.id,
                        requestStatusId = request.statusId,
                        Description = $"Korisnik {CurrentUser.name} {CurrentUser.surname} je prijavio obranu iz predmeta {request.Course.name}. Datum obrane: {Utilities.GetUserTime(exam.examDateTime)?.ToString("dd.MM.yyyy HH:mm")}",
                        requestChanged = true
                    };
                    uow.RequestLogRepository.Insert(log);
                    uow.Save();
                    uow.RequestRepository.LoadReference(request, "Status");
                    request.examDateTime = exam.examDateTime;
                    log.CreatedBy = CurrentUser;
                    log.Request = request;
                    SendMailForRequest(request, $"Prijavljena obrana - {CurrentUser.name} {CurrentUser.surname} - {request.Course.shortname}",
                        log.Description);
                    return new
                    {
                        exam = GetUIObject(exam),
                        log = RequestController.GetLogUIObject(log)
                    };
                }                
            }
            return null;
		}

        [Route("api/exam/cancel")]
        [HttpPost]
        public object Cancel(int requestId)
        {
            var request = uow.RequestRepository.Get(r => r.id == requestId, includeProperties: "ExamRequests.Exam").FirstOrDefault();
            if (request != null)
            {
                request.statusId = RequestStatus.CodeApprovedPendingExam;
                var er = request.ExamRequests.FirstOrDefault(r => r.Exam.courseId == request.courseId && (r.dateCancelled == null || r.dateApplied > r.dateCancelled));
                
                if(er != null)
                {
                    er.dateCancelled = DateTime.UtcNow;

                    var log = new RequestLog
                    {
                        createdById = CurrentUser.id,
                        dateCreated = DateTime.UtcNow,
                        requestId = request.id,
                        requestStatusId = request.statusId,
                        Description = $"Korisnik {CurrentUser.name} {CurrentUser.surname} je odjavio obranu iz predmeta {request.Course.name}. Datum obrane: {Utilities.GetUserTime(er.Exam.examDateTime)?.ToString("dd.MM.yyyy HH:mm")}",
                        requestChanged = true
                    };
                    uow.RequestLogRepository.Insert(log);
                    uow.Save();
                    uow.RequestRepository.LoadReference(request, "Status");
                    log.CreatedBy = CurrentUser;
                    log.Request = request;
                    SendMailForRequest(request, $"Odjavljena obrana - {CurrentUser.name} {CurrentUser.surname} - {request.Course.shortname}",
                        log.Description);
                    return new
                    {
                        exam = GetUIObject(er.Exam),
                        log = RequestController.GetLogUIObject(log)
                    };
                }

                
            }
            return null;
        }

		[Route("api/exam/updateExamRequest")]
		[HttpPost]
		public object UpdateEr(ExamRequest er)
		{
			var exam = uow.ExamRepository.Get(e => e.id == er.examId, includeProperties: "Requests").FirstOrDefault();
			if (exam != null)
			{
				var req = exam.Requests.FirstOrDefault(re => re.requestId == er.requestId);
				if (req != null)
				{
					uow.CopyValues(req, er);
				}
				uow.Save();
			}
			return GetUIObject(exam);
		}

		public static object GetUIObject(Exam e, bool includeRequests = true)
		{
			return new
			{
				e.id,
				e.name,
				examDateTime = Utilities.GetUserTime(e.examDateTime),
				e.courseId,
				dateCreated = Utilities.GetUserTime(e.dateCreated),
				e.createdById,
				createdBy = e.CreatedBy != null ? new { e.CreatedBy.name, e.CreatedBy.surname } : null,
				course = e.Course != null ? new { e.Course.id, e.Course.name, e.Course.shortname } : null,
				requests = includeRequests ? e.Requests?.Select(r => new
				{
					r.examId,
					r.requestId,
					dateApplied = Utilities.GetUserTime(r.dateApplied),
					dateCancelled = Utilities.GetUserTime(r.dateCancelled),
					r.attended,
					r.grade,
					r.description,
					request = r.Request != null ? RequestController.GetUIObject(r.Request) : null                    
				}) : null
			};
		}
	}
}
