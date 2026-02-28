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
            helper.setTo(emailRequest.to());
            helper.setSubject(emailRequest.subject());
            helper.setText(emailRequest.body(), true);  // true indicates HTML content
            mailSender.send(mimeMessage);
            System.out.println("Mail Send...");
        } catch (MessagingException e) {
            System.out.println("Error sending email: " + e.getMessage());
        }
    }

    public void sendTemporaryPasswordEmail(String toEmail, String tempPassword) {
        String subject = "Welcome to CrediTrack - Your Temporary Login Password";
           String body = 	"<html>" +
				"<head>" +
				"<style>" +
				"body { font-family: Arial, sans-serif; background-color: #f4f4f4; }" +
				".container { max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }" +
				".header { color: #333333; margin-bottom: 20px; }" +
				".password-box { background-color: #f0f0f0; border: 2px solid #007bff; border-radius: 5px; padding: 20px; margin: 20px 0; text-align: center; }" +
				".password-text { font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 3px; font-family: 'Courier New', monospace; }" +
				".footer { color: #666666; font-size: 12px; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px; }" +
				"</style>" +
				"</head>" +
				"<body>" +
				"<div class='container'>" +
				"<div class='header'>" +
				"<h2>Welcome!</h2>" +
				"<p>Your temporary password has been generated. Please use the password below to access your account:</p>" +
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
        EmailRequest request = new EmailRequest(toEmail, subject, body);
        sendEmail(request);
    }
    
	 public void sendEvaluationEmail(
            List<Long> studentIds,
            String recipient,
            User programHead) {

        try {

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper =
                    new MimeMessageHelper(message, true);

            helper.setFrom(programHead.getEmail());
            helper.setTo(recipient);
            helper.setSubject("CrediTrack Evaluation Results");

            helper.setText(buildEmailBody(studentIds, programHead), true);

            // Attach multiple PDFs
            for (Long studentId : studentIds) {
                try {
                    byte[] pdf =
                            pdfGeneratorService.generateEvaluationPdf(studentId, programHead);

                    // Get student data for filename
                    var studentData = transcriptEvaluationService.getEvaluationByStudentId(studentId, programHead);
                    String studentName = studentData.lastName() + ", " + studentData.firstName();
                    String toProgram = studentData.toProgram() != null ? studentData.toProgram() : "Unknown";
                    String filename = studentName + " - " + toProgram + ".pdf";

                    helper.addAttachment(
                            filename,
                            new ByteArrayResource(pdf)
                    );
                } catch (Exception e) {
                    log.error("Error generating PDF for student ID: {}", studentId, e);
                    throw e;
                }
            }

            mailSender.send(message);
            log.info("Evaluation email sent successfully to: {}", recipient);

        } catch (Exception e) {
            log.error("Failed to send evaluation email to: {}", recipient, e);
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
            <div style="font-family:Arial;padding:20px">
                <p>Greetings!</p>
                <p>The CrediTrack results for the following students is attached to this email:</p>
                %s
                <br>
                <p>Please feel free to download and review the file at your convenience.</p>
                <p>Please be advised that this is only an initial review. A manual verification process is still required to ensure the accuracy and completeness of the result.</p>
                <br>
                <p>Best regards,<br><strong>CrediTrack</strong></p>
            </div>
            """.formatted(studentList.toString());
    }
}
