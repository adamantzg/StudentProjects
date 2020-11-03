using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PointProjectsWeb.Models
{
    public class PasswordChange
    {
        public string id { get; set; }
        public string code { get; set; }
        public string password { get; set; }
        public string password2 { get; set; }
    }
}