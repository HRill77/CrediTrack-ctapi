package com.cta.creditrack.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.cta.creditrack.dtos.EmailRequest;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

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
    
}
