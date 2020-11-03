using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using PointProjectsWeb.Models.Domain;
using System.Web;
using System.Net.Http.Headers;
using System.Net.Mail;

namespace PointProjectsWeb.Controllers
{
    [OnlyAuthorized]
    public class RequestController : BaseController
    {
        [Route("api/request/getRequestsForCurrentUser")]
        [HttpGet]
        public object GetRequestsForCurrentUser(int? logTake = null, int? logSkip = null)
        {
            if (CurrentUser != null)
            {
                var logs = getLogs(skip: logSkip, take: logTake);
                List<ProjectRequest> requests = null;
                if (CurrentUser.IsAdmin)
                {
                    var courseIds = CurrentUser.AdministeredCourses.Select(c => c.id).ToList();
                    requests = uow.RequestRepository.Get(r => courseIds.Contains(r.courseId), includeProperties: "Course, Subject,CreatedBy,Status,Comments")
                        .OrderByDescending(r => r.Comments.Count > 0 ? r.Comments.Max(c => c.dateCreated) : r.dateCreated).ToList();                    
                }
                else
                {
                    var id = CurrentUser.id;
                    requests = uow.RequestRepository.Get(r => r.createdById == id, includeProperties: "Course, Subject,CreatedBy,Status,Comments")
                        .OrderByDescending(r => r.Comments.Max(c => c.dateCreated)).ToList();
                }

                foreach (var r in requests.Where(req => req.statusId == RequestStatus.ExamTimeSlotDecided))
                {
                    var exam = uow.ExamRepository.Get(e => e.Requests.Any(er => er.requestId == r.id && (er.dateCancelled == null || er.dateApplied > er.dateCancelled)),
                        orderBy: e => e.OrderBy(ex => ex.examDateTime), includeProperties: "Requests").FirstOrDefault();
                    r.examDateTime = exam?.examDateTime;
                    /*if (exam != null)
                        r.ExamRequests = exam.Requests.Where(req => req.requestId == r.id).ToList();*/
                }
                return new
                {
                    requests = requests.Select(r => GetUIObject(r)),
                    logs,
                    workflows = uow.WorkflowRepository.Get().ToList()
                };
            }
            return new HttpResponseMessage(HttpStatusCode.Unauthorized);
        }

        [Route("api/request/create")]
        [HttpPost]
        public object CreateRequest(ProjectRequest request)
        {
            HttpResponseMessage message = new HttpResponseMessage { StatusCode = HttpStatusCode.Unauthorized };

            if (ValidateRequest(request, out message))
            {
                request.createdById = CurrentUser.id;
                var now = DateTime.UtcNow;
                request.dateCreated = now;
                request.dateDue = now.AddMonths(Properties.Settings.Default.DateDueOffset);
                request.statusId = RequestStatus.SubjectWaitingApproval;
                uow.RequestRepository.Insert(request);

                uow.Save();
                uow.RequestRepository.LoadReference(request, "Status");
                uow.RequestRepository.LoadReference(request, "Subject");

                var log = new RequestLog
                {
                    Description = $"Prijava kreirana. Tema: {GetSubjectName(request)} Predmet: {CurrentUser.EnrolledCourses.FirstOrDefault(c => c.id == request.courseId)?.name}",
                    createdById = CurrentUser.id,
                    dateCreated = DateTime.UtcNow,
                    requestId = request.id,
                    requestStatusId = request.statusId
                };
                uow.RequestLogRepository.Insert(log);
                uow.Save();
                
                SendMailForRequest(request, $"Prijava kreirana: {CurrentUser.surname} {CurrentUser.name} - #course#",
                    $"Naziv teme: {GetSubjectName(request)}<br>Komentar: {request.comment}");
                return new
                {
                    request = GetUIObject(request),
                    log = log
                };
            }

            return message;
        }

        [Route("api/request/update")]
        [HttpPost]
        public object UpdateRequest(ProjectRequest request)
        {
            if (request.subjectId != null)
                request.subjectText = null;

            if (request.subjectId == null && string.IsNullOrEmpty(request.subjectText))
                return new HttpResponseMessage { StatusCode = HttpStatusCode.BadRequest, Content = new StringContent("Tema mora biti upisana.") };
            var currentRequest = uow.RequestRepository.Get(r => r.id == request.id, includeProperties: "Subject, Course, Status,Comments,CreatedBy").FirstOrDefault();

            var subjectChanged = request.subjectId != currentRequest.subjectId || (currentRequest.subjectId == null && request.subjectText != currentRequest.subjectText);
            var dateDueChanged = request.dateDue?.Date != currentRequest.dateDue?.Date;
            var statusChanged = request.statusId != currentRequest.statusId;

            var previousSubjectName = GetSubjectName(currentRequest);
            var previousDateDue = currentRequest.dateDue;
            var previousStatus = currentRequest.Status.name;
            currentRequest.subjectText = request.subjectText;
            currentRequest.subjectId = request.subjectId;
            currentRequest.dateDue = request.dateDue;
            currentRequest.statusId = request.statusId;
            currentRequest.courseId = request.courseId;
            currentRequest.comment = request.comment;


            RequestComment newComment = null;
            if (request.Comments != null && request.Comments.Count > 0)
            {
                newComment = request.Comments[0];
                newComment.createdById = CurrentUser.id;
                newComment.dateCreated = DateTime.UtcNow;
                currentRequest.Comments.Add(newComment);
            }

            uow.Save();
            uow.RequestRepository.LoadReference(currentRequest, "Subject");
            uow.RequestRepository.LoadReference(currentRequest, "Course");
            uow.RequestRepository.LoadReference(currentRequest, "Status");

            var change = "Prijava promijenjena.";
            if (subjectChanged)
                change += $" Stara tema: {previousSubjectName} Nova tema: {GetSubjectName(currentRequest)}.";
            if (dateDueChanged)
                change += $" Stari datum isteka: {Utilities.GetUserTime(previousDateDue)?.ToShortDateString()} Novi datum isteka: {Utilities.GetUserTime(currentRequest.dateDue)?.ToShortDateString()}";
            if (statusChanged)
                change += $" Stari status: {previousStatus} Novi status: {currentRequest.Status.name}";

            var newCommentText = (newComment != null ? $"Komentar: {newComment.text}" : string.Empty);

            var log = new RequestLog
            {
                commentId = newComment?.id,
                createdById = CurrentUser.id,
                dateCreated = DateTime.UtcNow,
                Description = change,
                requestId = currentRequest.id,
                requestStatusId = currentRequest.statusId,
                requestChanged = subjectChanged || dateDueChanged || statusChanged
            };
            uow.RequestLogRepository.Insert(log);
            uow.Save();
            log.Comment = newComment;
            log.CreatedBy = CurrentUser;

            if (subjectChanged && !CurrentUser.IsAdmin)
                SendMailForRequest(request, $"Prijava promijenjena: {CurrentUser.surname} {CurrentUser.name} - {currentRequest.Course?.name}",
                        $"Stara tema: {previousSubjectName} Nova tema: {GetSubjectName(currentRequest)}<br>{newCommentText}");
            if (dateDueChanged && CurrentUser.IsAdmin)
                SendMailForRequest(request, "Datum isteka teme promijenjen",
                    $"Datum isteka za vašu temu {GetSubjectName(currentRequest)} za predmet #course# je promijenjen na {currentRequest.dateDue?.ToString("d")}<br>{newCommentText} ", false, true);
            if (statusChanged && CurrentUser.IsAdmin)
                SendMailForRequest(request, "Status teme promijenjen",
                    $"Status vaše teme {GetSubjectName(currentRequest)} za predmet #course# je promijenjen na {currentRequest.Status?.name} <br>{newCommentText}", false, true);
            return new
            {
                request = GetUIObject(currentRequest),
                log = log
            };
        }


        [Route("api/request/getAvailableCoursesForRequest")]
        [HttpGet]
        public object GetAvailableCourses()
        {
            var currentUserId = CurrentUser.id;
            var statuses = new[] { (int?)RequestStatus.SubjectRejected, (int?)RequestStatus.RequestCancelled };
            var takenCoursesIds = uow.RequestRepository.Get(r => r.createdById == currentUserId && !statuses.Contains(r.statusId)).Select(r => r.courseId).ToList();
            return CurrentUser.EnrolledCourses.Where(c => !takenCoursesIds.Contains(c.id)).ToList();
        }

        [Route("api/request/statuses")]
        [HttpGet]
        public object GetStatuses(int? courseId = null)
        {
            /*if(courseId == null)
                return uow.RequestStatusRepository.Get().ToList();
            return uow.RequestRepository.GetStatuses(courseId.Value);*/
            return uow.RequestStatusRepository.Get().OrderBy(s=>s.seq).Select(s => new
            {
                s.id,
                s.name,
                //s.requestStatusChangeText,
                s.seq/*,
                courses = s.Courses?.Select(c=> new { c.id, c.name})*/
            });
        }

        [Route("api/request/approve")]
        [HttpPost]
        public object Approve(ProjectRequest request)
        {
            var currentRequest = uow.RequestRepository.Get(r => r.id == request.id, includeProperties: "CreatedBy, Status,Subject, Course,Comments").FirstOrDefault();
            if (currentRequest != null)
            {
                if (request.Subject != null && request.Subject.id <= 0)
                {
                    //Create new subject
                    currentRequest.Subject = request.Subject;
                    currentRequest.Subject.createdById = request.createdById;
                    currentRequest.Subject.dateCreated = DateTime.UtcNow;
                    currentRequest.Subject.approvedById = CurrentUser.id;
                    currentRequest.Subject.dateApproved = DateTime.UtcNow;
                    currentRequest.Subject.Courses = new List<Course>();
                    currentRequest.Subject.Courses.Add(uow.CourseRepository.GetByID(request.courseId));
                }
                RequestComment comment = null;
                if (request.Comments != null && request.Comments.Count > 0)
                {
                    comment = new RequestComment { text = request.Comments[0].text };
                    comment.createdById = CurrentUser.id;
                    comment.dateCreated = DateTime.UtcNow;
                    currentRequest.Comments.Add(comment);
                }


                currentRequest.statusId = RequestStatus.SubjectApproved;
                currentRequest.approvedById = CurrentUser.id;
                currentRequest.dateApproved = DateTime.UtcNow;

                var log = new RequestLog();
                log.Description = $"Tema {GetSubjectName(currentRequest)} odobrena.";
                log.Comment = comment;
                log.createdById = CurrentUser.id;
                log.dateCreated = DateTime.UtcNow;
                log.requestId = currentRequest.id;
                log.requestStatusId = currentRequest.statusId;
                log.requestChanged = true;
                uow.RequestLogRepository.Insert(log);

                uow.Save();
                uow.RequestRepository.LoadReference(currentRequest, "Subject");
                uow.RequestRepository.LoadReference(currentRequest, "Status");

                SendMailForRequest(currentRequest, $"Vaša tema {GetSubjectName(currentRequest)} za predmet {currentRequest.Course?.name} je odobrena", request.Comments?.Count > 0 ? "Napomena: " + request.Comments[0].text : "", toUser: true, toAdmin: false);
                return new
                {
                    request = GetUIObject(currentRequest),
                    log = log
                };
            }
            return null;

        }

        [Route("api/request/setStatus")]
        [HttpPost]
        public object SetStatus(int requestId, int statusId, [FromBody] RequestComment comment)
        {
            var request = uow.RequestRepository.Get(r => r.id == requestId, includeProperties: "Status,Subject, Course,Comments, CreatedBy").FirstOrDefault();
            var oldStatus = request.Status?.name;
            if (request != null)
            {
                request.statusId = statusId;
                if (statusId == RequestStatus.SubjectApproved)
                {
                    request.approvedById = CurrentUser.id;
                    request.dateApproved = DateTime.UtcNow;
                }
                if (comment != null)
                {
                    comment.createdById = CurrentUser.id;
                    comment.dateCreated = DateTime.UtcNow;
                    request.Comments.Add(comment);
                }
                uow.Save();
                uow.RequestRepository.LoadReference(request, "Status");
                var log = new RequestLog();
                log.Description = $"Status promijenjen iz {oldStatus} u {request.Status.name}";
                log.createdById = CurrentUser.id;
                log.dateCreated = DateTime.UtcNow;
                log.requestChanged = true;
                log.requestId = requestId;
                log.requestStatusId = statusId;
                log.commentId = comment?.id;
                uow.RequestLogRepository.Insert(log);
                uow.Save();

                log.Comment = comment;
                log.CreatedBy = CurrentUser;

                if (statusId == RequestStatus.RequestCancelled)
                    SendMailForRequest(request, $"Prijava poništena - {CurrentUser.surname} {CurrentUser.name}. Naziv teme: {GetSubjectName(request)}");
                else if (statusId == RequestStatus.RequestReinstated)
                    SendMailForRequest(request, $"Prijava ponovno aktivirana - {CurrentUser.surname} {CurrentUser.name}. Naziv teme: {GetSubjectName(request)}");
                else if (statusId == RequestStatus.SubjectApproved)
                {
                    SendMailForRequest(request, $"Vaša tema {GetSubjectName(request)} za predmet {request.Course?.name} je odobrena", comment != null ? "Napomena: " + comment.text : "", toUser: true, toAdmin: false);
                }
                else if (statusId == RequestStatus.SubjectRejected)
                    SendMailForRequest(request, $"Vaša tema {GetSubjectName(request)} za predmet {request.Course?.name} je odbijena", comment != null ? "Napomena: " + comment.text : "", toUser: true, toAdmin: false);
                else if(statusId == RequestStatus.DatabaseApproved)
                    SendMailForRequest(request, $"Baza podataka za vašu temu {GetSubjectName(request)} za predmet {request.Course?.name} je odobrena", comment != null ? "Napomena: " + comment.text : "", toUser: true, toAdmin: false);
                else if (statusId == RequestStatus.CodeApprovedPendingExam)
                    SendMailForRequest(request, $"Kod za vašu temu {GetSubjectName(request)} za predmet {request.Course?.name} je odobren. Projekt je sada u statusu čekanja obrane. Prijavite se na portal i ako ima otvorenih rokova, prijavite se za obranu.", comment != null ? "Napomena: " + comment.text : "", toUser: true, toAdmin: false);
                return new { request = GetUIObject(request), comment = comment != null ? GetCommentUIObject(comment) : null, log = log };
            }
            return null;
        }

        [Route("api/request/createComment")]
        [HttpPost]
        public object CreateComment(RequestComment comment)
        {
            var request = uow.RequestRepository.Get(r => r.id == comment.requestId, includeProperties: "Comments, CreatedBy, Subject, Course,Status").FirstOrDefault();
            if (request != null)
            {
                var oldStatus = request.Status.name;
                //file handling
                if (comment.Files != null && comment.Files.Count > 0)
                {
                    foreach (var f in comment.Files)
                    {
                        f.data = Utilities.GetTempFile(f.file_id);
                    }
                    long currentTotalFileSize;
                    if (!CheckQuota(request.createdById, comment.Files, out currentTotalFileSize))
                        return new HttpResponseMessage
                        {
                            StatusCode = HttpStatusCode.BadRequest,
                            Content = new StringContent($"Veličina datoteka premašuje vašu kvotu od {Properties.Settings.Default.UploadLimit}. Dosadašnja veličina: {currentTotalFileSize * 1.0 / 1e6:N2} MB. Veličina uploadanih datoteka: {comment.Files.Sum(f => f.data.Length) * 1.0 / 1e6:N2} MB")
                        };
                }

                comment.createdById = CurrentUser.id;
                comment.dateCreated = DateTime.UtcNow;
                request.Comments.Add(comment);

                uow.Save();

                var workflows = uow.WorkflowRepository.Get().ToList();

                RequestLog log = null;
                if (comment.statusChange == true)
                {
                    var newStatusId = workflows
                        .FirstOrDefault(w => w.courseId == request.courseId && w.statusId == request.statusId)
                        ?.nextStatusId;
                    if (newStatusId != null)
                        request.statusId = newStatusId.Value;
                    uow.Save();
                    uow.RequestRepository.LoadReference(request, "Status");
                    log = new RequestLog
                    {
                        commentId = comment.id,
                        createdById = CurrentUser.id,
                        dateCreated = DateTime.UtcNow,
                        requestId = request.id,
                        requestStatusId = request.statusId,
                        Description = $"Status promijenjen iz {oldStatus} u {request.Status.name}. "
                    };
                    log.requestChanged = comment.statusChange == true;
                    uow.RequestLogRepository.Insert(log);
                    uow.Save();
                    log.Comment = comment;
                    log.CreatedBy = CurrentUser;
                }

                var statusChanged = comment.statusChange == true;
                comment.Request = request;
                comment.CreatedBy = CurrentUser;
                var subject = $"{GetSubjectName(request)} ({request.Course?.name})";
                var user = $"{(CurrentUser.IsAdmin ? " administrator" : $" korisnik {CurrentUser.name} {CurrentUser.surname}")}";
                SendMailForRequest(request, !statusChanged ? $"Novi komentar u temi {subject}" : $"Promjena statusa teme {subject}",
                    !statusChanged ?
                    $"Za temu {subject} je {user} ostavio novi komentar. <br>Tekst: {comment.text}" :
                    $"Za temu {subject} je {user} promijenio status iz {oldStatus} u {request.Status.name}. <br/>Komentar: {comment.text}"
                    , !CurrentUser.IsAdmin, CurrentUser.IsAdmin, comment.Files);

                return statusChanged ? GetLogUIObject(log) : GetLogRowFromComment(comment);
            }
            return null;
        }



        [Route("api/request/upload")]
        [HttpPost]
        public object UploadImage()
        {
            var request = HttpContext.Current.Request;
            var file = request.Files[0];
            var id = request["id"];
            Utilities.SaveTempFile(id, Utilities.FileStreamToBytes(file.InputStream));
            return new { success = true };
        }

        [Route("api/request/getTempUrl")]
        [HttpGet]
        public HttpResponseMessage getTempUrl(string file_id, string name = null)
        {
            var result = new HttpResponseMessage(HttpStatusCode.OK);

            result.Content = new ByteArrayContent(Utilities.GetTempFile(file_id));
            if (name != null)
                result.Content.Headers.ContentDisposition = new ContentDispositionHeaderValue("attachment") { FileName = name };
            result.Content.Headers.ContentType =
                new MediaTypeHeaderValue("application/octet-stream");
            return result;
        }

        [Route("api/request/getFile")]
        [HttpGet]
        public HttpResponseMessage getFile(int id)
        {
            var result = new HttpResponseMessage(HttpStatusCode.OK);
            var commentFile = uow.RequestRepository.GetFile(id);
            if (commentFile != null)
            {
                result.Content = new ByteArrayContent(commentFile.data);
                result.Content.Headers.ContentDisposition = new ContentDispositionHeaderValue("attachment");
                result.Content.Headers.ContentDisposition.FileName = commentFile.name;
                result.Content.Headers.ContentType =
                    new MediaTypeHeaderValue("application/octet-stream");
                return result;
            }
            return null;
        }

        [Route("api/request/log")]
        [HttpGet]
        public object getLogs(IList<int?> requestIds = null, int? skip = null, int? take = null)
        {
            var coursesIds = CurrentUser.IsAdmin ? CurrentUser.AdministeredCourses.Select(c => c.id).ToList() : CurrentUser.EnrolledCourses.Select(c => c.id).ToList();
            if(requestIds == null)
                requestIds = new List<int?>();
            var logs = CurrentUser.IsAdmin ?
                uow.RequestLogRepository.Get(l => (requestIds.Count == 0 && coursesIds.Contains(l.Request.courseId))
                || requestIds.Contains(l.requestId) , l=>l.OrderByDescending(x=>x.dateCreated), take, skip,
                includeProperties: "Request, CreatedBy,Comment.Files").ToList() :
                uow.RequestLogRepository.Get(l => (requestIds.Count == 0 && l.Request.createdById == CurrentUser.id)
                || requestIds.Contains(l.requestId),l=>l.OrderByDescending(x=>x.dateCreated), take, skip,
                includeProperties: "Request,CreatedBy,Comment.Files").ToList();

            var logCommentIds = logs.Where(l => l.commentId != null).Select(l => l.commentId).ToList();

            var comments = CurrentUser.IsAdmin ?
                uow.CommentsRepository.Get(c => (requestIds.Count == 0 && coursesIds.Contains(c.Request.courseId))
                || requestIds.Contains(c.requestId), c=>c.OrderByDescending(x=>x.dateCreated), take, skip,
                includeProperties: "Request.CreatedBy, CreatedBy,Files").ToList() :
                uow.CommentsRepository.Get(c => (requestIds.Count == 0 && c.Request.createdById == CurrentUser.id)
                || requestIds.Contains(c.requestId),c=>c.OrderByDescending(x=>x.dateCreated), take, skip,
                includeProperties: "Request.CreatedBy,CreatedBy,Files").ToList();
            //var comments = requests.SelectMany(r => r.Comments).Where(c => !logCommentIds.Contains(c.id)).ToList();

            return logs.Select(GetLogUIObject).
            Union(comments.Select(c => GetLogRowFromComment(c))).OrderByDescending(o => o.dateCreated);
        }

        [Route("api/request/getRequestsForIds")]
        [HttpGet]
        public object GetRequestsForIds(string ids, int? skipLog = null, int? takeLog = null)
        {
            if (CurrentUser != null)
            {
                var idList = ids.Split(',').Select(int.Parse).ToList();
                var logs = getLogs(idList.Select(i=>(int?) i).ToList(), skipLog, takeLog);
                List<ProjectRequest> requests = null;                
                if (CurrentUser.IsAdmin)
                {
                    requests = uow.RequestRepository.Get(r => idList.Contains(r.id), includeProperties: "Course, Subject,CreatedBy,Status,Comments")
                        .OrderByDescending(r => r.Comments.Count > 0 ? r.Comments.Max(c => c.dateCreated) : r.dateCreated).ToList();                    
                }
                else
                {
                    var id = CurrentUser.id;
                    requests = uow.RequestRepository.Get(r => idList.Contains(r.id) && r.createdById == id, includeProperties: "Course, Subject,CreatedBy,Status,Comments")
                        .OrderByDescending(r => r.Comments.Max(c => c.dateCreated)).ToList();
                }
                
                return new
                {
                    requests = requests.Select(r => GetUIObject(r)),
                    logs,
                    workflows = uow.WorkflowRepository.Get().ToList()
                };
            }
            return new HttpResponseMessage(HttpStatusCode.Unauthorized);
        }

        public static object GetLogUIObject(RequestLog l)
        {
            return new
            {
                Comment = l.Comment != null ? GetCommentUIObject(l.Comment) : null,
                CreatedBy = new { l.CreatedBy?.id, l.CreatedBy?.name, l.CreatedBy?.surname },
                createdById = l.createdById,
                dateCreated = Utilities.GetUserTime(l.dateCreated),
                Description = l.Description,
                Request = GetUIObject(l.Request),
                requestId = l.requestId,
                requestStatusId = l.requestStatusId,
                requestChanged = l.requestChanged ?? (l.Comment?.statusChange == true)
            };
        }

        private dynamic GetLogRowFromComment(RequestComment c)
        {
            return new
            {
                Comment = c != null ? GetCommentUIObject(c) : null,
                CreatedBy = new { c.CreatedBy?.id, c.CreatedBy?.name, c.CreatedBy?.surname },
                createdById = c.createdById,
                dateCreated = Utilities.GetUserTime(c.dateCreated),
                Description = c.text,
                Request = GetUIObject(c.Request),
                requestId = c.requestId,
                requestChanged = false
            };
        }
                
        private string GetSubjectName(ProjectRequest r)
        {
            return r.Subject?.name ?? r.subjectText;
        }

        private bool ValidateRequest(ProjectRequest request, out HttpResponseMessage message)
        {
            if (request.subjectId == null && string.IsNullOrEmpty(request.subjectText))
            {
                message = new HttpResponseMessage { StatusCode = HttpStatusCode.BadRequest, Content = new StringContent("Tema mora biti upisana.") };
                return false;
            }
            if (request.courseId <= 0)
            {
                message = new HttpResponseMessage { StatusCode = HttpStatusCode.BadRequest, Content = new StringContent("Predmet mora biti odabran.") };
                return false;
            }

            message = null;
            return true;
        }

        public static object GetUIObject(ProjectRequest r, bool includeComments = true)
        {
            return new
            {
                r.createdById,
                CreatedBy = r.CreatedBy != null ? new { r.CreatedBy.id, r.CreatedBy.name, r.CreatedBy.surname } : null,
                r.courseId,
                Course = r.Course != null ? new { r.Course.id, r.Course?.name, r.Course?.shortname } : null,
                r.id,
                r.statusId,
                Status = r.Status != null ? new { r.Status.id, r.Status.name } : null,
                r.approvedById,
                dateApproved = Utilities.GetUserTime(r.dateApproved),
                dateCreated = Utilities.GetUserTime(r.dateCreated),
                dateClosed = Utilities.GetUserTime(r.dateClosed),
                dateDue = Utilities.GetUserTime(r.dateDue),
                r.subjectId,
                r.comment,
                Subject = r.Subject != null ? new { r.Subject.id, r.Subject.name } : null,
                comments = includeComments ? r.Comments?.OrderByDescending(c => c.dateCreated).Select(c => GetCommentUIObject(c)) : null,
                r.subjectText,
                examDateTime = Utilities.GetUserTime(r.examDateTime),
                examRequests = r.ExamRequests != null ? r.ExamRequests.Select(er=> new {
                    exam = ExamController.GetUIObject(er.Exam, false),
                    er.requestId,
                    er.examId,
                    dateApplied = Utilities.GetUserTime(er.dateApplied),
                    dateCancelled = Utilities.GetUserTime(er.dateCancelled),
                    er.attended,
                    er.description
                }) : null
            };
        }

        public static object GetCommentUIObject(RequestComment c, bool includeRequest = false)
        {
            return new
            {
                c.text,
                dateCreated = Utilities.GetUserTime(c.dateCreated),
                c.createdById,
                c.requestId,
                c.statusChange,
                request = includeRequest ? GetUIObject(c.Request, false) : null,
                createdBy = c.CreatedBy != null ? new { c.CreatedBy.name, c.CreatedBy.surname } : null,
                files = c.Files?.Select(f => new
                {
                    f.id,
                    f.commentId,
                    f.name
                })
            };
        }

        private bool CheckQuota(int? createdById, List<CommentFile> files, out long currentSize)
        {
            currentSize = uow.RequestRepository.GetTotalFileSize(createdById);
            var totalSize = currentSize + Convert.ToInt64(files.Sum(f => f.data?.Length));

            return totalSize < (Properties.Settings.Default.UploadLimit * 1024 * 1024);
        }
    }

    public class ActivityRow
    {
        public int requestId { get; set; }
        public object Request { get; set; }
        public string Description { get; set; }
        public int? createdById { get; set; }
        public object CreatedBy { get; set; }
        public int? requestStatusId { get; set; }
        public DateTime? dateCreated { get; set; }
        public object Comment { get; set; }
    }
}
