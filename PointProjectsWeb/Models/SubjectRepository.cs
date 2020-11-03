using PointProjectsWeb.Models.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data.Entity;
using RefactorThis.GraphDiff;

namespace PointProjectsWeb.Models
{
    public class SubjectRepository : GenericRepository<Subject>
    {
        public SubjectRepository(DbContext context) : base(context)
        {

        }

        public override void Insert(Subject entity)
        {
            if(entity.Courses != null)
                for (int i = 0; i < entity.Courses.Count; i++)
                {
                    var c = entity.Courses[i];
                    var course = context.Set<Course>().Local.FirstOrDefault(co => co.id == c.id);
                    if(course == null)
                        context.Set<Course>().Attach(c);
                    else
                    {
                        entity.Courses[i] = course;
                    }
                }
                

            base.Insert(entity);
        }

        public override void Update(Subject entityToUpdate)
        {
            context.UpdateGraph(entityToUpdate, m => m.AssociatedCollection(s => s.Courses));
        }
    }
}
