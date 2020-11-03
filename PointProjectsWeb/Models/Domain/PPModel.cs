namespace PointProjectsWeb.Models.Domain
{
    using System;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity;
    using System.Linq;

    public class PPModel : DbContext
    {
        // Your context has been configured to use a 'PPModel' connection string from your application's 
        // configuration file (App.config or Web.config). By default, this connection string targets the 
        // 'PointProjectsWeb.Models.Domain.PPModel' database on your LocalDb instance. 
        // 
        // If you wish to target a different database and/or database provider, modify the 'PPModel' 
        // connection string in the application configuration file.
        public PPModel()
            : base("name=PPModel")
        {
            Database.SetInitializer<PPModel>(null);
        }

        // Add a DbSet for each entity type that you want to include in your model. For more information 
        // on configuring and using a Code First model, see http://go.microsoft.com/fwlink/?LinkId=390109.

        // public virtual DbSet<MyEntity> MyEntities { get; set; }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            var mb = modelBuilder;
            var schema = "pointprojects";

            mb.Entity<User>().ToTable("User",schema);
            mb.Entity<Group>().ToTable("Group",schema);
            mb.Entity<UserGroup>().ToTable("UserGroup",schema);
            mb.Entity<UserSession>().ToTable("UserSession", schema);

            mb.Entity<User>().HasMany(u => u.Groups).WithRequired(g => g.User).HasForeignKey(g => g.UserId);
            mb.Entity<User>().HasMany(u => u.EnrolledCourses).WithMany().Map(m => m.ToTable("user_course", schema).MapLeftKey("user_id").MapRightKey("course_id"));

            mb.Entity<Group>().HasMany(u => u.Users).WithRequired(g => g.Group).HasForeignKey(g => g.GroupId);

            mb.Entity<UserGroup>().HasKey(ug => new { ug.UserId, ug.GroupId });

            mb.Entity<UserSession>().HasRequired(s => s.User).WithMany(u=>u.Sessions).HasForeignKey(s => s.UserId);

            mb.Entity<Course>().ToTable("Course", schema);
            mb.Entity<Course>().HasOptional(c => c.Administrator).WithMany(u=>u.AdministeredCourses).HasForeignKey(c => c.admin_id);
            mb.Entity<Course>().HasMany(c => c.Subjects).WithMany(s => s.Courses).Map(m => m.ToTable("subject_course",schema).MapLeftKey("course_id").MapRightKey("subject_id"));

            mb.Entity<Subject>().ToTable("Subject", schema);
            //mb.Entity<Subject>().Property(s => s.description).HasColumnType("varchar(MAX)");
            mb.Entity<Subject>().HasOptional(s => s.ApprovedBy).WithMany().HasForeignKey(s => s.approvedById);
            mb.Entity<Subject>().HasOptional(s => s.CreatedBy).WithMany().HasForeignKey(s => s.createdById);

            mb.Entity<ProjectRequest>().ToTable("ProjectRequest", schema);
            mb.Entity<ProjectRequest>().HasOptional(r => r.ApprovedBy).WithMany().HasForeignKey(r => r.approvedById);
            mb.Entity<ProjectRequest>().HasRequired(r => r.CreatedBy).WithMany(u=>u.Requests).HasForeignKey(r => r.createdById).WillCascadeOnDelete(false);
            mb.Entity<ProjectRequest>().HasRequired(r => r.Course).WithMany(c=>c.Requests).HasForeignKey(r => r.courseId).WillCascadeOnDelete(false);
            mb.Entity<ProjectRequest>().HasRequired(r => r.Status).WithMany().HasForeignKey(r => r.statusId).WillCascadeOnDelete(false);
            mb.Entity<ProjectRequest>().HasOptional(r => r.Subject).WithMany(s=>s.Requests).HasForeignKey(r => r.subjectId);
            mb.Entity<ProjectRequest>().HasMany(r => r.Comments).WithRequired(c => c.Request).HasForeignKey(c => c.requestId);
            //mb.Entity<ProjectRequest>().Property(s => s.comment).HasColumnType("varchar(MAX)");

            mb.Entity<RequestStatus>().ToTable("RequestStatus", schema);
            mb.Entity<RequestStatus>().Property(s => s.id).HasDatabaseGeneratedOption(DatabaseGeneratedOption.None);
            /*mb.Entity<RequestStatus>().HasMany(s => s.Courses).WithMany().Map(m =>
                m.ToTable("RequestStatus_Course",schema).MapLeftKey("statusId").MapRightKey("courseId"));*/

            mb.Entity<RequestComment>().ToTable("RequestComment", schema);
            mb.Entity<RequestComment>().HasRequired(s => s.CreatedBy).WithMany().HasForeignKey(s => s.createdById).WillCascadeOnDelete(false);
            mb.Entity<RequestComment>().HasMany(c => c.Files).WithRequired(f => f.Comment).HasForeignKey(f => f.commentId);

            mb.Entity<CommentFile>().ToTable("CommentFile", schema);
            
            mb.Entity<RequestLog>().ToTable("RequestLog", schema);
            mb.Entity<RequestLog>().HasRequired(l => l.Request).WithMany().HasForeignKey(l => l.requestId);
            mb.Entity<RequestLog>().HasOptional(l => l.CreatedBy).WithMany().HasForeignKey(l => l.createdById);
			mb.Entity<RequestLog>().HasOptional(l => l.Comment).WithMany().HasForeignKey(l => l.commentId);

            mb.Entity<Exam>().ToTable("Exam", schema);
            mb.Entity<Exam>().HasOptional(e => e.Course).WithMany().HasForeignKey(e => e.courseId);
            mb.Entity<Exam>().HasOptional(e => e.CreatedBy).WithMany().HasForeignKey(e => e.createdById);
            mb.Entity<ExamRequest>().ToTable("ExamRequest", schema);
            mb.Entity<ExamRequest>().HasKey(e => new { e.examId, e.requestId });
            mb.Entity<ExamRequest>().HasRequired(e => e.Request).WithMany(r=>r.ExamRequests).HasForeignKey(e => e.requestId);
            mb.Entity<Exam>().HasMany(e => e.Requests).WithRequired(r=>r.Exam).HasForeignKey(r => r.examId);

            mb.Entity<ProjectWorkflow>().ToTable("ProjectWorkflow", schema);



        }

    }

    

    //public class MyEntity
    //{
    //    public int Id { get; set; }
    //    public string Name { get; set; }
    //}
}
