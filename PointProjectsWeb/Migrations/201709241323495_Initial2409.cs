namespace PointProjectsWeb.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class Initial2409 : DbMigration
    {
        public override void Up()
        {
            CreateTable(
                "pointprojects.User",
                c => new
                    {
                        id = c.Int(nullable: false, identity: true),
                        name = c.String(),
                        surname = c.String(),
                        username = c.String(),
                        password = c.String(),
                        email = c.String(),
                        registrationCode = c.String(),
                        dateCreated = c.DateTime(),
                    })
                .PrimaryKey(t => t.id);
            
            CreateTable(
                "pointprojects.Course",
                c => new
                    {
                        id = c.Int(nullable: false, identity: true),
                        name = c.String(),
                        admin_id = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.id)
                .ForeignKey("pointprojects.User", t => t.admin_id)
                .Index(t => t.admin_id);
            
            CreateTable(
                "pointprojects.ProjectRequest",
                c => new
                    {
                        id = c.Int(nullable: false, identity: true),
                        courseId = c.Int(nullable: false),
                        subjectId = c.Int(nullable: false),
                        createdById = c.Int(nullable: false),
                        approvedById = c.Int(),
                        dateCreated = c.DateTime(),
                        dateApproved = c.DateTime(),
                        statusId = c.Int(nullable: false),
                        comment = c.String(),
                    })
                .PrimaryKey(t => t.id)
                .ForeignKey("pointprojects.User", t => t.approvedById)
                .ForeignKey("pointprojects.Course", t => t.courseId)
                .ForeignKey("pointprojects.User", t => t.createdById)
                .ForeignKey("pointprojects.RequestStatus", t => t.statusId)
                .ForeignKey("pointprojects.Subject", t => t.subjectId)
                .Index(t => t.courseId)
                .Index(t => t.subjectId)
                .Index(t => t.createdById)
                .Index(t => t.approvedById)
                .Index(t => t.statusId);
            
            CreateTable(
                "pointprojects.RequestComment",
                c => new
                    {
                        id = c.Int(nullable: false, identity: true),
                        requestId = c.Int(nullable: false),
                        text = c.String(),
                        createdById = c.Int(nullable: false),
                        dateCreated = c.DateTime(),
                    })
                .PrimaryKey(t => t.id)
                .ForeignKey("pointprojects.User", t => t.createdById)
                .ForeignKey("pointprojects.ProjectRequest", t => t.requestId, cascadeDelete: true)
                .Index(t => t.requestId)
                .Index(t => t.createdById);
            
            CreateTable(
                "pointprojects.CommentFile",
                c => new
                    {
                        id = c.Int(nullable: false, identity: true),
                        commentId = c.Int(nullable: false),
                        name = c.String(),
                        data = c.Binary(),
                    })
                .PrimaryKey(t => t.id)
                .ForeignKey("pointprojects.RequestComment", t => t.commentId, cascadeDelete: true)
                .Index(t => t.commentId);
            
            CreateTable(
                "pointprojects.RequestStatus",
                c => new
                    {
                        id = c.Int(nullable: false),
                        name = c.String(),
                    })
                .PrimaryKey(t => t.id);
            
            CreateTable(
                "pointprojects.Subject",
                c => new
                    {
                        id = c.Int(nullable: false, identity: true),
                        name = c.String(),
                        description = c.String(),
                        createdById = c.Int(nullable: false),
                        approvedById = c.Int(),
                        dateCreated = c.DateTime(),
                        dateApproved = c.DateTime(),
                    })
                .PrimaryKey(t => t.id)
                .ForeignKey("pointprojects.User", t => t.approvedById)
                .ForeignKey("pointprojects.User", t => t.createdById)
                .Index(t => t.createdById)
                .Index(t => t.approvedById);
            
            CreateTable(
                "pointprojects.UserGroup",
                c => new
                    {
                        UserId = c.Int(nullable: false),
                        GroupId = c.Int(nullable: false),
                        isAdmin = c.Boolean(),
                    })
                .PrimaryKey(t => new { t.UserId, t.GroupId })
                .ForeignKey("pointprojects.Group", t => t.GroupId, cascadeDelete: true)
                .ForeignKey("pointprojects.User", t => t.UserId, cascadeDelete: true)
                .Index(t => t.UserId)
                .Index(t => t.GroupId);
            
            CreateTable(
                "pointprojects.Group",
                c => new
                    {
                        id = c.Int(nullable: false, identity: true),
                        name = c.String(),
                        dateCreated = c.DateTime(),
                    })
                .PrimaryKey(t => t.id);
            
            CreateTable(
                "pointprojects.UserSession",
                c => new
                    {
                        id = c.Int(nullable: false, identity: true),
                        UserId = c.Int(nullable: false),
                        Token = c.Guid(nullable: false),
                        DateCreated = c.DateTime(),
                    })
                .PrimaryKey(t => t.id)
                .ForeignKey("pointprojects.User", t => t.UserId, cascadeDelete: true)
                .Index(t => t.UserId);
            
            CreateTable(
                "pointprojects.user_course",
                c => new
                    {
                        user_id = c.Int(nullable: false),
                        course_id = c.Int(nullable: false),
                    })
                .PrimaryKey(t => new { t.user_id, t.course_id })
                .ForeignKey("pointprojects.User", t => t.user_id, cascadeDelete: true)
                .ForeignKey("pointprojects.Course", t => t.course_id, cascadeDelete: true)
                .Index(t => t.user_id)
                .Index(t => t.course_id);
            
        }
        
        public override void Down()
        {
            DropForeignKey("pointprojects.UserSession", "UserId", "pointprojects.User");
            DropForeignKey("pointprojects.UserGroup", "UserId", "pointprojects.User");
            DropForeignKey("pointprojects.UserGroup", "GroupId", "pointprojects.Group");
            DropForeignKey("pointprojects.user_course", "course_id", "pointprojects.Course");
            DropForeignKey("pointprojects.user_course", "user_id", "pointprojects.User");
            DropForeignKey("pointprojects.ProjectRequest", "subjectId", "pointprojects.Subject");
            DropForeignKey("pointprojects.Subject", "createdById", "pointprojects.User");
            DropForeignKey("pointprojects.Subject", "approvedById", "pointprojects.User");
            DropForeignKey("pointprojects.ProjectRequest", "statusId", "pointprojects.RequestStatus");
            DropForeignKey("pointprojects.ProjectRequest", "createdById", "pointprojects.User");
            DropForeignKey("pointprojects.ProjectRequest", "courseId", "pointprojects.Course");
            DropForeignKey("pointprojects.RequestComment", "requestId", "pointprojects.ProjectRequest");
            DropForeignKey("pointprojects.CommentFile", "commentId", "pointprojects.RequestComment");
            DropForeignKey("pointprojects.RequestComment", "createdById", "pointprojects.User");
            DropForeignKey("pointprojects.ProjectRequest", "approvedById", "pointprojects.User");
            DropForeignKey("pointprojects.Course", "admin_id", "pointprojects.User");
            DropIndex("pointprojects.user_course", new[] { "course_id" });
            DropIndex("pointprojects.user_course", new[] { "user_id" });
            DropIndex("pointprojects.UserSession", new[] { "UserId" });
            DropIndex("pointprojects.UserGroup", new[] { "GroupId" });
            DropIndex("pointprojects.UserGroup", new[] { "UserId" });
            DropIndex("pointprojects.Subject", new[] { "approvedById" });
            DropIndex("pointprojects.Subject", new[] { "createdById" });
            DropIndex("pointprojects.CommentFile", new[] { "commentId" });
            DropIndex("pointprojects.RequestComment", new[] { "createdById" });
            DropIndex("pointprojects.RequestComment", new[] { "requestId" });
            DropIndex("pointprojects.ProjectRequest", new[] { "statusId" });
            DropIndex("pointprojects.ProjectRequest", new[] { "approvedById" });
            DropIndex("pointprojects.ProjectRequest", new[] { "createdById" });
            DropIndex("pointprojects.ProjectRequest", new[] { "subjectId" });
            DropIndex("pointprojects.ProjectRequest", new[] { "courseId" });
            DropIndex("pointprojects.Course", new[] { "admin_id" });
            DropTable("pointprojects.user_course");
            DropTable("pointprojects.UserSession");
            DropTable("pointprojects.Group");
            DropTable("pointprojects.UserGroup");
            DropTable("pointprojects.Subject");
            DropTable("pointprojects.RequestStatus");
            DropTable("pointprojects.CommentFile");
            DropTable("pointprojects.RequestComment");
            DropTable("pointprojects.ProjectRequest");
            DropTable("pointprojects.Course");
            DropTable("pointprojects.User");
        }
    }
}
