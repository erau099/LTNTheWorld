package com.codecraft.lovethyneighbor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

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