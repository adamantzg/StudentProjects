using PointProjectsWeb.Models.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data.Entity;

namespace PointProjectsWeb.Models
{
    public class RequestRepository : GenericRepository<ProjectRequest>
    {
        public RequestRepository(DbContext context) : base(context)
        {
        }

		public long GetTotalFileSize(int? userId)
		{
			return context.Database.SqlQuery<long>("SELECT COALESCE(SUM(DATALENGTH(cf.data)),0) FROM pointprojects.commentFile cf INNER JOIN pointprojects.requestcomment c ON cf.commentId = c.id WHERE c.createdById = @p0", userId).FirstOrDefault();            
		}

        public CommentFile GetFile(int id)
        {
            return context.Database.SqlQuery<CommentFile>("SELECT * FROM pointprojects.commentFile WHERE id = @p0 ", id).FirstOrDefault();
        }

        public IEnumerable<RequestStatus> GetStatuses(int courseId)
        {
            return context.Database.SqlQuery<RequestStatus>(
                @"SELECT RequestStatus.id, 
                    CASE WHEN pointprojects.CourseRequestStatus.id IS NOT NULL THEN pointprojects.CourseRequestStatus.statusText 
                    ELSE RequestStatus.name END ,
                    CASE WHEN pointprojects.CourseRequestStatus.id IS NOT NULL THEN pointprojects.CourseRequestStatus.requestStatusChangeText 
                    ELSE RequestStatus.requestStatusChangeText END 
                    FROM  pointprojects.RequestStatus
                    LEFT OUTER JOIN pointprojects.CourseRequestStatus ON pointprojects.RequestStatus.id = 
                    pointprojects.CourseRequestStatus.originalRequestStatusId AND pointprojects.CourseRequestStatus.courseId = @p0",
                courseId);
        }


    }
}
