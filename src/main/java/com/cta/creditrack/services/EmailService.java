package com.cta.creditrack.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.cta.creditrack.dtos.EmailRequest;
import com.cta.creditrack.model.User;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class EmailService {

  @Autowired
  private JavaMailSender mailSender;
  @Autowired
  private PdfGeneratorService pdfGeneratorService;
  @Autowired
  private TranscriptEvaluationService transcriptEvaluationService;

  public void sendEmail(EmailRequest emailRequest) {
    try {
      MimeMessage mimeMessage = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
      helper.setFrom("fromemail@gmail.com");
      helper.setTo(emailRequest.recipientEmail());
      helper.setSubject(emailRequest.subject());

      // prefer explicit HTML if provided
      String content = emailRequest.html() != null ? emailRequest.html() : emailRequest.body();
      helper.setText(content, true); // always send as HTML

      mailSender.send(mimeMessage);
      log.info("Mail sent to {}", emailRequest.recipientEmail());
    } catch (MessagingException e) {
      log.error("Error sending email: {}", e.getMessage(), e);
    }
  }

  public void sendTemporaryPasswordEmail(String toEmail, String tempPassword) {
    String subject = "Welcome to CrediTrack - Your Temporary Login Password";
    String body = "<html>" +
        "<head>" +
        "<style>" +
        "body { font-family: Arial, sans-serif; background-color: #f4f4f4; }" +
        ".container { max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }"
        +
        ".header { color: #333333; margin-bottom: 20px; }" +
        ".password-box { background-color: #f0f0f0; border: 2px solid #007bff; border-radius: 5px; padding: 20px; margin: 20px 0; text-align: center; }"
        +
        ".password-text { font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 3px; font-family: 'Courier New', monospace; }"
        +
        ".footer { color: #666666; font-size: 12px; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px; }"
        +
        "</style>" +
        "</head>" +
        "<body>" +
        "<div class='container'>" +
        "<div class='header'>" +
        "<h2>Welcome!</h2>" +
        "<p>Your temporary password has been generated. Please use the password below to access your account:</p>"
        +
        "</div>" +
        "<div class='password-box'>" +
        "<div class='password-text'>" + tempPassword + "</div>" +
        "</div>" +
        "<p><strong>Instructions:</strong></p>" +
        "<ul>" +
        "<li>Use the above password to log in to your account</li>" +
        "<li>Change your password immediately after your first login</li>" +
        "<li>This password expires in 24 hours</li>" +
        "</ul>" +
        "<div class='footer'>" +
        "<p>This is an automated message. Please do not reply to this email.</p>" +
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

    try {
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

      helper.setFrom(sender.getEmail());
      helper.setTo(recipientEmail);
      helper.setSubject("CrediTrack Evaluation Results");
      helper.setText(emailBody, true);

      // Attach multiple PDFs
      for (Long studentId : studentIds) {
        try {
          byte[] pdf = pdfGeneratorService.generateEvaluationPdf(studentId, sender);

          var studentData = transcriptEvaluationService.getEvaluationByStudentId(studentId, sender);
          String studentName = studentData.lastName() + ", " + studentData.firstName();
          String toProgram = studentData.toProgram() != null ? studentData.toProgram() : "Unknown";
          String filename = studentName + " - " + toProgram + ".pdf";

          helper.addAttachment(filename, new ByteArrayResource(pdf));
        } catch (Exception e) {
          log.error("Error generating PDF for student ID: {}", studentId, e);
          throw e;
        }
      }

      mailSender.send(message);
      log.info("Evaluation email sent successfully to: {}", recipientEmail);
    } catch (Exception e) {
      log.error("Failed to send evaluation email to: {}", recipientEmail, e);
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