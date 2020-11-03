using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using PointProjectsWeb.Models.Domain;


namespace PointProjectsWeb.Models
{
	public class UnitOfWork : IDisposable
	{
		private PPModel context = null;

		private static PPModel CreateModel()
		{
			var model = new PPModel();
			model.Configuration.ProxyCreationEnabled = false;
			model.Configuration.LazyLoadingEnabled = false;
            model.Database.CommandTimeout = 300;
			return model;
		}

	    public UnitOfWork()
	    {
	        context = CreateModel();
	    }

	    public UnitOfWork(PPModel context)
	    {
	        this.context = context;
            context.Configuration.ProxyCreationEnabled = false;
            context.Configuration.LazyLoadingEnabled = false;
            context.Database.CommandTimeout = 300;
        }

		private GenericRepository<User> userRepository;
        private GenericRepository<Group> groupRepository;
		private SubjectRepository subjectRepository;
		private GenericRepository<Course> courseRepository;
        private RequestRepository requestRepository;
		private GenericRepository<RequestLog> requestLogRepository;
		private GenericRepository<RequestStatus> requestStatusRepository;
        private GenericRepository<Exam> examRepository;
	    private GenericRepository<ProjectWorkflow> workflowRepository;
        private GenericRepository<RequestComment> commentsRepository;

		public GenericRepository<User> UserRepository 
		{
			get
			{

				if (this.userRepository == null) {
					this.userRepository = new GenericRepository<User>(context);
				}
				return userRepository;
			}
		}

        public GenericRepository<Group> GroupRepository
        {
            get
            {

                if (this.groupRepository == null)
                {
                    this.groupRepository = new GenericRepository<Group>(context);
                }
                return groupRepository;
            }
        }

		public SubjectRepository SubjectRepository
		{
			get
			{

				if (this.subjectRepository == null)
				{
					this.subjectRepository = new SubjectRepository(context);
				}
				return subjectRepository;
			}
		}

		public GenericRepository<Course> CourseRepository
		{
			get
			{

				if (this.courseRepository == null)
				{
					this.courseRepository = new GenericRepository<Course>(context);
				}
				return courseRepository;
			}
		}

        public RequestRepository RequestRepository
		{
			get
			{

				if (this.requestRepository == null)
				{
					this.requestRepository = new RequestRepository(context);
				}
				return requestRepository;
			}
		}

		public GenericRepository<RequestLog> RequestLogRepository
		{
			get
			{

				if (this.requestLogRepository == null)
				{
					this.requestLogRepository = new GenericRepository<RequestLog>(context);
				}
				return requestLogRepository;
			}
		}

		public GenericRepository<RequestStatus> RequestStatusRepository
		{
			get
			{

				if (this.requestStatusRepository == null)
				{
					this.requestStatusRepository = new GenericRepository<RequestStatus>(context);
				}
				return requestStatusRepository;
			}
		}

        public GenericRepository<Exam> ExamRepository
        {
            get
            {
                if (this.examRepository == null)
                {
                    this.examRepository = new GenericRepository<Exam>(context);
                }
                return examRepository;
            }
        }

	    public GenericRepository<ProjectWorkflow> WorkflowRepository
	    {
	        get
	        {
	            if (this.workflowRepository == null)
	            {
	                this.workflowRepository = new GenericRepository<ProjectWorkflow>(context);
	            }
	            return workflowRepository;
	        }
	    }

        public GenericRepository<RequestComment> CommentsRepository
	    {
	        get
	        {
	            if (this.commentsRepository == null)
	            {
	                this.commentsRepository = new GenericRepository<RequestComment>(context);
	            }
	            return commentsRepository;
	        }
	    }

        public void Save()
		{
			context.SaveChanges();            
		}

		private bool disposed = false;

		protected virtual void Dispose(bool disposing)
		{
			if (!this.disposed) {
				if (disposing) {
					context.Dispose();
				}
			}
			this.disposed = true;
		}

		public void Dispose()
		{
			Dispose(true);
			GC.SuppressFinalize(this);
		}

        public void CopyValues(object to, object from)
        {
            var entry = context.Entry(to);
            entry.CurrentValues.SetValues(from);
        }

	    public void EnableAutoChanges()
	    {
	        context.Configuration.AutoDetectChangesEnabled = true;
	    }        

	    public IDbConnection Connection => context.Database.Connection;

        
    }
}
