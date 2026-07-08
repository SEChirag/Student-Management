package com.test.Service;

import com.test.Event.StudentAccountCreateEvent;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.slf4j.Logger;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onStudentAccountCreated(StudentAccountCreateEvent event) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(event.getStudent().getEmail());
            message.setSubject("Your Student Portal Login Credentials");
            message.setText(buildBody(event));
            mailSender.send(message);
            log.info("Login email sent to {}", event.getStudent().getEmail());
        } catch (Exception ex) {
            log.error("Failed to send login email to student id={} email={}. Reason: {}",
                    event.getStudent().getId(), event.getStudent().getEmail(), ex.getMessage(), ex);
        }
    }

    private String buildBody(StudentAccountCreateEvent event) {
        return "Hello " + event.getStudent().getName() + ",\n\n"
                + "Your student portal account has been created.\n\n"
                + "Username: " + event.getStudent().getUsername() + "\n"
                + "Temporary Password: " + event.getTempPassword() + "\n"
                + "Login URL: https:studentManagement.com/login\n\n"
                + "Please change your password after your first login.\n\n"
                + "Regards,\nAdmin Team";
    }
}
