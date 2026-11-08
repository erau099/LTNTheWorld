package com.codecraft.lovethyneighbor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    // DT-332: sent at signup; the account can't log in until this link is used
    public void sendSignupConfirmation(String toEmail, String firstName, String verificationLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Confirm your Love Thy Neighbor account");
        message.setText("Hi " + firstName + ",\n\n"
                + "Thanks for signing up for Love Thy Neighbor. Please confirm your account by clicking the link below:\n\n"
                + verificationLink + "\n\n"
                + "This link will expire in 24 hours."
                + "\nIf you did not create this account, you can ignore this email.");
        mailSender.send(message);
    }

    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(toEmail);
        message.setSubject("Reset your Love Thy Neighbor password");

        message.setText(
                "We received a request to reset the password for your "
                + "Love Thy Neighbor account.\n\n"
                + "Use the link below to reset your password:\n\n"
                + resetLink
                + "\n\nThis link will expire in 30 minutes."
                + "\nIf you did not request a password reset, you can ignore this email.");

        mailSender.send(message);
    }

    public void sendPasswordResetNotification(String toEmail) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Your password was reset");
        message.setText("This is a confirmation that your Love Thy Neighbor account password was just reset. "
                + "If you did not make this change, please contact support immediately.");
        mailSender.send(message);
    }

    public void sendEmailChangeNotification(String oldEmail, String newEmail) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(oldEmail);
        message.setSubject("Your account email was changed");
        message.setText("This is a confirmation that your Love Thy Neighbor account email was changed to "
                + newEmail + ". If you did not make this change, please contact support immediately.");
        mailSender.send(message);
    }
}