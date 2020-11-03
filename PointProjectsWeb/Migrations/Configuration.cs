namespace PointProjectsWeb.Migrations
{
    using PointProjectsWeb.Models.Domain;
    using System;
    using System.Collections.Generic;
    using System.Data.Entity;
    using System.Data.Entity.Migrations;
    using System.Linq;

    internal sealed class Configuration : DbMigrationsConfiguration<Models.Domain.PPModel>
    {
        public Configuration()
        {
            AutomaticMigrationsEnabled = true;
        }

        protected override void Seed(PointProjectsWeb.Models.Domain.PPModel context)
        {
			//  This method will be called after migrating to the latest version.

			//  You can use the DbSet<T>.AddOrUpdate() helper extension method 
			//  to avoid creating duplicate seed data. E.g.
			//
			//    context.People.AddOrUpdate(
			//      p => p.FullName,
			//      new Person { FullName = "Andrew Peters" },
			//      new Person { FullName = "Brice Lambson" },
			//      new Person { FullName = "Rowan Miller" }
			//    );
			//

			var group = new Group { name = "Point 3. godina" };
			context.Set<Group>().AddOrUpdate(g => g.name, group);

			var user = new User { name = "Tvrtko", surname = "Begović", username = "tvbegovic",email = "tvrtkobegovic@gmail.com", password = "pero", Groups = new List<UserGroup>() { new UserGroup { Group = group, isAdmin = true } } };

			//context.Set<User>().AddOrUpdate(u => u.surname, new User { name = "Luka", surname = "Kataviæ", username="lukatavic", registrationCode = Guid.NewGuid().ToString(), Groups = new List<UserGroup>() { new UserGroup { Group = group } }  });
			//context.Set<User>().AddOrUpdate(u => u.surname, new User { name = "Valerijan", surname = "Salak",username="vasalak", registrationCode = Guid.NewGuid().ToString(), Groups = new List<UserGroup>() { new UserGroup { Group = group } }  });

			//var user = context.Set<User>().FirstOrDefault(u => u.email == "tvrtkobegovic@gmail.com");
            context.Set<User>().AddOrUpdate(u => u.email, user);

            context.Set<Course>().AddOrUpdate(c => c.name, new Course { name = "Programski jezik C#",shortname = "C#", Administrator = user });
            context.Set<Course>().AddOrUpdate(c => c.name, new Course { name = "Izrada aplikacija za mobilne platforme", shortname= "Mobilne",Administrator = user });

            
            context.Set<RequestStatus>().AddOrUpdate(s => s.id, new RequestStatus { id = 1, name = "Prijavljena tema"});
            context.Set<RequestStatus>().AddOrUpdate(s => s.id, new RequestStatus { id = 2, name = "Tema čeka odobravanje" });
            context.Set<RequestStatus>().AddOrUpdate(s => s.id, new RequestStatus { id = 3, name = "Tema odobrena" });
            context.Set<RequestStatus>().AddOrUpdate(s => s.id, new RequestStatus { id = 4, name = "Baza podataka čeka odobravanje" });
            context.Set<RequestStatus>().AddOrUpdate(s => s.id, new RequestStatus { id = 5, name = "Baza podataka odobrena" });
            context.Set<RequestStatus>().AddOrUpdate(s => s.id, new RequestStatus { id = 6, name = "Aplikacija čeka odobravanje" });
            context.Set<RequestStatus>().AddOrUpdate(s => s.id, new RequestStatus { id = 7, name = "Aplikacija odobrena/čeka se obrana" });
            context.Set<RequestStatus>().AddOrUpdate(s => s.id, new RequestStatus { id = 8, name = "Termin obrane zadan." });
            context.Set<RequestStatus>().AddOrUpdate(s => s.id, new RequestStatus { id = 9, name = "Neuspješna obrana" });
            context.Set<RequestStatus>().AddOrUpdate(s => s.id, new RequestStatus { id = 10, name = "Rad uspješno obranjen" });
            context.Set<RequestStatus>().AddOrUpdate(s => s.id, new RequestStatus { id = 11, name = "Tema odbijena" });
			context.Set<RequestStatus>().AddOrUpdate(s => s.id, new RequestStatus { id = 12, name = "Tema povučena" });
			context.Set<RequestStatus>().AddOrUpdate(s => s.id, new RequestStatus { id = 13, name = "Tema ponovno aktivirana" });


			context.SaveChanges();

        }
    }
}
