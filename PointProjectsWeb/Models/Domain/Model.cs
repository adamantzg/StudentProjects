using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;

namespace PointProjectsWeb.Models.Domain
{
    

    public class User
    {
        [Key]        
        public int id { get; set; }
        [Column(TypeName = "varchar")]
        [MaxLength(50)]
        public string name { get; set; }
        [Column(TypeName = "varchar")]
        [MaxLength(50)]
        public string surname { get; set; }
        [Column(TypeName = "varchar")]
        [MaxLength(50)]
        public string username { get; set; }
        [Column(TypeName = "varchar")]
        [MaxLength(30)]
        public string password { get; set; }
        [Column(TypeName = "varchar")]
        [MaxLength(100)]
        public string email { get; set; }
        [Column(TypeName = "varchar")]
        [MaxLength(50)]
        public string registrationCode { get; set; }
        public DateTime? dateCodeSent { get; set; }
        public List<UserGroup> Groups { get; set; }
        public DateTime? dateCreated { get; set; }
        public List<UserSession> Sessions { get; set; }
		public List<Course> EnrolledCourses { get; set; }
		public List<Course> AdministeredCourses { get; set; }

        public List<ProjectRequest> Requests { get; set; }
    [NotMapped]
    public List<Course> AvailableCourses { get; set; }

        [NotMapped]
        public string Token { get; set; }

        public bool IsAdminForGroup(int groupId)
        {
            return Groups != null && Groups.Any(g => g.GroupId == groupId && g.isAdmin == true);            
        }

        public bool IsAdmin
        {
            get
            {
                return Groups != null && Groups.Any(g => g.isAdmin == true);
            }
        }
    }

    public class Group
    {
        [Key]
        public int id { get; set; }
        [Column(TypeName = "varchar")]
        [MaxLength(50)]
        public string name { get; set; }
        public List<UserGroup> Users { get; set; }
        public DateTime? dateCreated { get; set; }
    }

    public class UserGroup
    {
        public User User { get; set;}
        public Group Group { get; set; }
        public int UserId { get; set; }
        public int GroupId { get; set; }
        public bool? isAdmin { get; set; }
    }

    public class UserSession
    {
        [Key]
        public int id { get; set; }
        public User User { get; set; }
        public int UserId { get; set; }
        public Guid Token { get; set; }
        public DateTime? DateCreated { get; set; }
    }

    public class Course
    {
        [Key]
        public int id { get; set; }
        [Column(TypeName = "varchar")]
        [MaxLength(50)]
        public string name { get; set; }
        [Column(TypeName = "varchar")]
        [MaxLength(50)]
        public string shortname { get; set; }
        public int? admin_id { get; set; }
        public User Administrator { get; set; }
        public List<ProjectRequest> Requests { get; set; }
        public List<Subject> Subjects { get; set; }
    }

    public class Subject
    {
        [Key]
        public int id { get; set; }
        [Column(TypeName = "varchar")]
        [MaxLength(50)]
        public string name { get; set; }
        public string description { get; set; }
        public int? createdById { get; set; }
        public User CreatedBy { get; set; }
        public User ApprovedBy { get; set; }
        public int? approvedById { get; set; }
        public DateTime? dateCreated { get; set; }
        public DateTime? dateApproved { get; set; }
		public List<Course> Courses { get; set; }
		
		public List<ProjectRequest> Requests { get; set; }
    }

    public class ProjectRequest
    {
        [Key]
        public int id { get; set; }
        public int courseId { get; set; }
        public Course Course { get; set; }
        public int? subjectId { get; set; }
        public string subjectText { get; set; }
        public Subject Subject { get; set; }
        public int? createdById { get; set; }
        public User CreatedBy { get; set; }
        public User ApprovedBy { get; set; }
        public int? approvedById { get; set; }
        public DateTime? dateCreated { get; set; }
        public DateTime? dateApproved { get; set; }
        public DateTime? dateDue { get; set; }
        public DateTime? dateClosed { get; set; }
        public int statusId { get; set; }
        public RequestStatus Status { get; set; }
        public string comment { get; set; }
        public List<RequestComment> Comments { get; set; }

        [NotMapped]
        public DateTime? examDateTime { get; set; }

        public List<ExamRequest> ExamRequests { get; set; }
    }

    public class RequestLog
    {
        [Key]
        public int id { get; set; }
        public int requestId { get; set; }
        public ProjectRequest Request { get; set; }
		public int? commentId { get; set; }
        public string Description { get; set; }
        public int? createdById { get; set; }
        public User CreatedBy { get; set; }
        public int? requestStatusId { get; set; }
        public DateTime? dateCreated { get; set; }
        public bool? requestChanged { get; set; }

        public RequestComment Comment { get; set; }               
        		
    }

    public class RequestStatus
    {
        
        public const int RequestCreated=1;
        public const int SubjectWaitingApproval=2;
        public const int SubjectApproved=3;
        public const int DatabaseWaitingApproval=4;
        public const int DatabaseApproved=5;
        public const int CodeWaitingApproval=6;
        public const int CodeApprovedPendingExam=7;
        public const int ExamTimeSlotDecided=8;
        public const int FailedExam=9;
        public const int PassedExam=10;
        public const int SubjectRejected = 11;
		public const int RequestCancelled = 12;
		public const int RequestReinstated = 13;
        public const int SpecificationWaitingApproval = 14;
        public const int SpecificationApproved = 15;


        [Key]
        public int id { get; set; }
        [Column(TypeName = "varchar")]
        [MaxLength(50)]
        public string name { get; set; }
        //public string requestStatusChangeText { get; set; }
        public int? seq { get; set; }

        //public List<Course> Courses { get; set; }
    }

    public class RequestComment
    {
        [Key]
        public int id { get; set; }
        public int requestId { get; set; }
        public ProjectRequest Request { get; set; }
        /*public bool? databaseSent { get; set; }
        public bool? codeSent { get; set; }*/
        public bool? statusChange { get; set; }
		
        public string text { get; set; }
        public int? createdById { get; set; }
        public User CreatedBy { get; set; }
        public DateTime? dateCreated { get; set; }
        public List<CommentFile> Files { get; set; }

		
    }

    public class CommentFile
    {
        [Key]
        public int id { get; set; }
        public int commentId { get; set; }
        public RequestComment Comment { get; set; }
        [Column(TypeName = "varchar")]
        [MaxLength(50)]
        public string name { get; set; }
        public byte[] data { get; set; }

		[NotMapped]
		public string file_id { get; set; }
	}

    public class Exam
    {
        [Key]
        public int id { get; set; }
        public string name { get; set; }
        public DateTime? examDateTime { get; set; }
        public int? courseId { get; set; }
        public int? createdById { get; set; }
        public DateTime? dateCreated { get; set; }
        public Course Course { get; set; }

        public User CreatedBy { get; set; }
        public List<ExamRequest> Requests { get; set; }
    }

    public class ExamRequest
    {
        public int examId { get; set; }
        public int requestId { get; set; }
        public DateTime? dateApplied { get; set; }
        public DateTime? dateCancelled { get; set; }
        public bool? attended { get; set; }
        public int? grade { get; set; }
        public string description { get; set; }

        public ProjectRequest Request { get; set; }
        public Exam Exam { get; set; }
    }

    public class ProjectWorkflow
    {
        public int id { get; set; }
        public int? courseId { get; set; }
        public int? statusId { get; set; }
        public int? nextStatusId { get; set; }
        public string requestStatusChangeText { get; set; }
        public bool? isStart { get; set; }
    }

}

