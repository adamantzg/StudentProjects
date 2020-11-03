using PointProjectsWeb.Models;
using PointProjectsWeb.Models.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Newtonsoft.Json;
using System.Net.Mail;
using System.Net;
using System.Text;
using System.Web.Security;
using System.IO;
using System.Net.Http;

namespace PointProjectsWeb
{
    public class Utilities
    {
        
		static TimeZoneInfo TZInfo = TimeZoneInfo.FindSystemTimeZoneById("Central European Standard Time");
        const string tokenKey = "Authorization";

		static object lockObj = new object();

		/*public static User GetUser(int id)
        {
            var tokenCookie = HttpContext.Current.Request.Cookies["pprojects_user_token"]?.Value;
            if (tokenCookie != null)
                return GetUser(id, Guid.Parse(tokenCookie));
            return null;
        }*/

        public static User GetCurrentUser()
        {
            var userCookie = HttpContext.Current.Request.Cookies["pprojects_user"]?.Value;
            if (userCookie != null)
                return JsonConvert.DeserializeObject<User>(Unprotect(userCookie, "cookie"));
            var tokenCookie = HttpContext.Current.Request.Cookies["pprojects_user_token"]?.Value;
            /*if (tokenCookie != null)
                return GetUserFromToken(tokenCookie);
            var token = GetTokenFromRequest(HttpContext.Current.Items["MS_HttpRequestMessage"] as HttpRequestMessage);
            if(token != null)
                return GetUserFromToken(token);*/
            return null;

        }

        /*public static User GetCurrentUser(string token)
        {
            if (string.IsNullOrEmpty(token))
                return null;
            return GetUserFromToken(token);
        }*/

        

        public static string GetTokenFromRequest(HttpRequestMessage request)
        {
            IEnumerable<string> values;
            string token = null;
            if (request.Headers.TryGetValues(tokenKey, out values))
                token = values.FirstOrDefault();
            if(token == null)
            {
                var qsDict = request.GetQueryNameValuePairs().ToDictionary(x => x.Key, x => x.Value);
                if (qsDict.ContainsKey(tokenKey))
                    token = qsDict[tokenKey];
            }
            return token;
        }

        

        /*public static User GetUser(int id, Guid token)
        {
            return uow.UserRepository.Get(u => u.id == id && u.Sessions.Any(s => s.Token == token), includeProperties: "Sessions").FirstOrDefault();
        }*/

        
        public static void SendMail(string to, string subject, string body,string cc = null, string bcc = null, IList<Attachment> attachments = null)
        {
            MailMessage msgMail = new MailMessage();

            MailMessage myMessage = new MailMessage();
            myMessage.From = new MailAddress(Properties.Settings.Default.SMTPFrom);
#if DEBUG
           
            myMessage.To.Add("tvrtkobegovic@gmail.com");

#else
            myMessage.To.Add(to);
#endif

            if (!string.IsNullOrEmpty(cc))
            {
#if !DEBUG
                myMessage.CC.Add(cc);
#endif
            }

            if (!string.IsNullOrEmpty(bcc))
            {
#if !DEBUG
                myMessage.Bcc.Add(bcc);
#endif
            }

            myMessage.Subject = subject;
            if (attachments != null)
            {
                foreach (var a in attachments)
                    myMessage.Attachments.Add(a);
            }

            myMessage.IsBodyHtml = true;

            myMessage.Body = body;

#if DEBUG
            myMessage.Body += string.Format("<br> Original recipient: {0} CC: {1}  BCC: {2} ", to, cc, bcc);
#endif

            SmtpClient mySmtpClient = new SmtpClient();                      
                       
            mySmtpClient.Host = Properties.Settings.Default.SMTPServer;
            mySmtpClient.Port = Properties.Settings.Default.SMTPPort;
                       
            var myCredential = new NetworkCredential(Properties.Settings.Default.SMTPFrom, Properties.Settings.Default.SMTPPassword);
            mySmtpClient.UseDefaultCredentials = false;
            mySmtpClient.Credentials = myCredential;
            
            mySmtpClient.ServicePoint.MaxIdleTime = 1;            
            mySmtpClient.Send(myMessage);
            
        }

        public static string Protect(string unprotectedText, string purpose = "email")
        {
            var unprotectedBytes = Encoding.UTF8.GetBytes(unprotectedText);
            var protectedBytes = MachineKey.Protect(unprotectedBytes, purpose);
            var protectedText = Convert.ToBase64String(protectedBytes);
            return protectedText;
        }

        public static string Unprotect(string protectedText,string purpose = "email")
        {
            var protectedBytes = Convert.FromBase64String(protectedText);
            var unprotectedBytes = MachineKey.Unprotect(protectedBytes, purpose);
            var unprotectedText = Encoding.UTF8.GetString(unprotectedBytes);
            return unprotectedText;
        }

        public static string GetSiteUrl()
        {
            return HttpContext.Current.Request.Url.GetLeftPart(UriPartial.Authority);
        }

		public static DateTime? GetUserTime(DateTime? utcTime)
		{
			if (utcTime == null)
				return null;
			return TimeZoneInfo.ConvertTimeFromUtc(utcTime.Value, TZInfo);
		}

		public static void SaveTempFile(string id, byte[] file, string prefix = "tempFile_")
		{
			HttpContext.Current.Session[prefix + id] = file;
		}

		public static byte[] FileStreamToBytes(Stream s)
		{
			var ms = new MemoryStream();
			s.CopyTo(ms);
			return ms.ToArray();
		}

		public static Stream BytesToStream(byte[] array)
		{
			return new MemoryStream(array);
		}

		public static byte[] GetTempFile(string id, string prefix = "tempFile_")
		{

			if (HttpContext.Current.Session[prefix + id] == null)
				return null;

			return (byte[])HttpContext.Current.Session[prefix + id];
		}

	}
}
