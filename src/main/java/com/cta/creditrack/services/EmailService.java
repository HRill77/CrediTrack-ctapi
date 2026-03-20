package com.cta.creditrack.services;

import java.io.IOException;
import java.util.Base64;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.cta.creditrack.dtos.EmailRequest;
import com.cta.creditrack.model.User;
import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Attachments;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import com.sendgrid.helpers.mail.objects.Personalization;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class EmailService {

  @Value("${sendgrid.api.key}")
  private String apiKey;

  @Value("${sendgrid.from.email}")
  private String fromEmail;

  private final PdfGeneratorService pdfGeneratorService;
  private final TranscriptEvaluationService transcriptEvaluationService;

  public EmailService(PdfGeneratorService pdfGeneratorService,
      TranscriptEvaluationService transcriptEvaluationService) {
    this.pdfGeneratorService = pdfGeneratorService;
    this.transcriptEvaluationService = transcriptEvaluationService;
  }

  public void sendEmail(EmailRequest emailRequest) {
    String html = emailRequest.html() != null ? emailRequest.html() : emailRequest.body();
    sendViaSendGrid(emailRequest.recipientEmail(), emailRequest.subject(), html, null);
    log.info("Mail sent to {}", emailRequest.recipientEmail());
  }

  public void sendTemporaryPasswordEmail(String toEmail, String tempPassword) {
    String subject = "Welcome to CrediTrack - Your Temporary Login Password";
    String body = "<html>" +
        "<head>" +
        "<style>" +
        "body { font-family: Arial, sans-serif; background-color: #e8e8e8; margin: 0; padding: 0; }" +
        ".wrapper { padding: 30px 20px; }" +
        ".title { text-align: center; font-size: 24px; font-weight: bold; color: #064F1E; margin-bottom: 20px; }" +
        ".container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px 40px; border-radius: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); }"
        +
        "p { color: #333333; font-size: 15px; line-height: 1.6; margin: 0 0 14px 0; }" +
        "ul { color: #333333; font-size: 15px; line-height: 1.8; padding-left: 20px; margin: 0 0 14px 0; }" +
        ".password-box { background-color: #f5f6f3; border: 2px solid #064F1E; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center; }"
        +
        ".password-text { font-size: 30px; font-weight: bold; color: #064F1E; letter-spacing: 4px; font-family: 'Courier New', monospace; }"
        +
        ".signature { margin-top: 20px; }" +
        ".signature p { margin: 0; }" +
        ".footer-bar { max-width: 600px; margin: 0 auto; padding: 20px 40px; border-top: 1px solid #e0e0e0; }" +
        ".footer-brand { font-size: 18px; font-weight: bold; color: #064F1E; margin: 0 0 4px 0; }" +
        ".footer-sub { font-size: 12px; color: #666666; margin: 0; line-height: 1.6; }" +
        "</style>" +
        "</head>" +
        "<body>" +
        "<div class='wrapper'>" +
        "<div class='title'>Your Temporary CrediTrack Password</div>" +
        "<div class='container'>" +
        "<p>Greetings!</p>" +
        "<p>A temporary password has been generated for your CrediTrack account. Please use the password below to log in:</p>"
        +
        "<div class='password-box'>" +
        "<div class='password-text'>" + tempPassword + "</div>" +
        "</div>" +
        "<p><strong>Instructions:</strong></p>" +
        "<ul>" +
        "<li>Use the above password to log in to your account.</li>" +
        "<li>Change your password immediately after your first login.</li>" +
        "<li>This password expires in 24 hours.</li>" +
        "</ul>" +
        "<p>If you did not request this, please contact your system administrator immediately.</p>" +
        "<div class='signature'>" +
        "<p>Best regards,</p>" +
        "<p><strong>CrediTrack</strong></p>" +
        "</div>" +
        "</div>" +
        "<div class='footer-bar'>" +
        "<p class='footer-brand'>CrediTrack</p>" +
        "<p class='footer-sub'>College of Engineering and Computer Technology<br/>Copyright &copy; 2026 CrediTrack. All rights reserved.</p>"
        +
        "</div>" +
        "</div>" +
        "</body>" +
        "</html>";
    EmailRequest request = new EmailRequest(toEmail, subject, body, body);
    sendEmail(request);
  }

  public void sendEvaluationEmail(
      List<Long> studentIds,
      String recipientEmail,
      User sender,
      String htmlFromFrontend) {

    String emailBody = buildEmailBody(studentIds, sender);

    List<Attachments> attachments = new java.util.ArrayList<>();
    for (Long studentId : studentIds) {
      try {
        byte[] pdf = pdfGeneratorService.generateEvaluationPdf(studentId, sender);
        var studentData = transcriptEvaluationService.getEvaluationByStudentId(studentId, sender);
        String studentName = studentData.lastName() + ", " + studentData.firstName();
        String toProgram = studentData.toProgram() != null ? studentData.toProgram() : "Unknown";
        String filename = studentName + " - " + toProgram + ".pdf";

        Attachments attachment = new Attachments();
        attachment.setContent(Base64.getEncoder().encodeToString(pdf));
        attachment.setType("application/pdf");
        attachment.setFilename(filename);
        attachment.setDisposition("attachment");
        attachments.add(attachment);
      } catch (Exception e) {
        log.error("Error generating PDF for student ID: {}", studentId, e);
        throw new RuntimeException("PDF generation failed for student: " + studentId, e);
      }
    }

    sendViaSendGrid(recipientEmail, "CrediTrack Evaluation Results", emailBody, attachments);
    log.info("Evaluation email sent successfully to: {}", recipientEmail);
  }

  private void sendViaSendGrid(String to, String subject, String html, List<Attachments> attachments) {
    try {
      Mail mail = new Mail();
      mail.setFrom(new Email(fromEmail));
      mail.setSubject(subject);

      Personalization personalization = new Personalization();
      personalization.addTo(new Email(to));
      mail.addPersonalization(personalization);

      mail.addContent(new Content("text/html", html));

      if (attachments != null) {
        for (Attachments attachment : attachments) {
          mail.addAttachments(attachment);
        }
      }

      Request request = new Request();
      request.setMethod(Method.POST);
      request.setEndpoint("mail/send");
      request.setBody(mail.build());

      SendGrid sg = new SendGrid(apiKey);
      Response response = sg.api(request);
      log.info("SendGrid response: {} to {}", response.getStatusCode(), to);

      if (response.getStatusCode() >= 400) {
        log.error("SendGrid error body: {}", response.getBody());
        throw new RuntimeException("SendGrid failed with status: " + response.getStatusCode());
      }
    } catch (IOException e) {
      log.error("Error sending email via SendGrid: {}", e.getMessage(), e);
      throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
    }
  }

  private String buildEmailBody(List<Long> studentIds, User programHead) {
    StringBuilder studentList = new StringBuilder();
    int counter = 1;

    for (Long id : studentIds) {
      try {
        var student = transcriptEvaluationService.getEvaluationByStudentId(id, programHead);
        if (student != null) {
          studentList.append(counter++)
              .append(". ")
              .append(student.firstName())
              .append(" ")
              .append(student.lastName())
              .append(" - ")
              .append(student.fromUniversity() != null ? student.fromUniversity() : "Unknown University")
              .append("<br>");
        }
      } catch (Exception e) {
        studentList.append(counter++)
            .append(". Student ID: ")
            .append(id)
            .append("<br>");
      }
    }

    return """
        <html>
        <head>
          <meta charset="UTF-8"/>
          <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
          <style>@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');</style>
        </head>
        <body style="margin:0;padding:0;background-color:#ebebeb;font-family:'Poppins',sans-serif;">
          <div style="padding:48px 16px;">

            <h1 style="text-align:center;font-family:'Poppins',sans-serif;font-size:22px;font-weight:700;color:#1a5c2a;margin:0 0 24px 0;">An initial CrediTrack result has been sent!</h1>

            <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.08);overflow:hidden;">

              <div style="padding:36px 40px 28px;">
                <p style="font-family:'Poppins',sans-serif;font-size:14px;color:#222;margin:0 0 16px 0;">Greetings!</p>
                <p style="font-family:'Poppins',sans-serif;font-size:13.5px;color:#222;line-height:1.75;margin:0 0 14px 0;">The CrediTrack results for the following students is attached to this email:</p>

                %s

                <p style="font-family:'Poppins',sans-serif;font-size:13.5px;color:#222;line-height:1.75;margin:14px 0;">Please feel free to download and review the file at your convenience.</p>
                <p style="font-family:'Poppins',sans-serif;font-size:13.5px;color:#222;line-height:1.75;margin:0 0 24px 0;">Please be advised that this is only an initial review. A manual verification process is still required to ensure the accuracy and completeness of the result.</p>
                <p style="font-family:'Poppins',sans-serif;font-size:13.5px;color:#222;line-height:1.75;margin:0 0 8px 0;">Best regards,<br/><strong>CrediTrack</strong></p>
              </div>

              <div style="border-top:1px solid #e8e8e8;padding:20px 40px;display:flex;align-items:center;gap:14px;">
                <div style="flex-shrink:0;">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="8" y="4" width="26" height="34" rx="3" stroke="#1a5c2a" stroke-width="2" fill="none"/>
                    <path d="M28 4L34 10L28 10Z" stroke="#1a5c2a" stroke-width="1.5" fill="none"/>
                    <line x1="13" y1="17" x2="28" y2="17" stroke="#1a5c2a" stroke-width="1.5" stroke-linecap="round"/>
                    <line x1="13" y1="22" x2="28" y2="22" stroke="#1a5c2a" stroke-width="1.5" stroke-linecap="round"/>
                    <line x1="13" y1="27" x2="22" y2="27" stroke="#1a5c2a" stroke-width="1.5" stroke-linecap="round"/>
                    <circle cx="33" cy="34" r="9" fill="#eef5ee" stroke="#1a5c2a" stroke-width="1.5"/>
                    <path d="M28.5 34L31.5 37L37.5 31" stroke="#1a5c2a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                  </svg>
                </div>
                <div>
                  <div style="font-family:'Poppins',sans-serif;font-size:20px;font-weight:700;color:#1a5c2a;line-height:1;">CrediTrack</div>
                  <div style="font-family:'Poppins',sans-serif;font-size:10px;color:#888;margin-top:3px;line-height:1.5;">College of Engineering and Computer Technology<br/>Copyright &copy; 2026 CrediTrack. All rights reserved.</div>
                </div>
              </div>

            </div>
          </div>
        </body>
        </html>
         """
        .formatted(studentList.toString());
  }
}