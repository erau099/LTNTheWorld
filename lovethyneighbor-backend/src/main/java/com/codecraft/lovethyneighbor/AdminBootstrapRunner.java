package com.codecraft.lovethyneighbor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class AdminBootstrapRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrapRunner.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String bootstrapEmail;
    private final String bootstrapPassword;

    public AdminBootstrapRunner(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.bootstrap-email:}") String bootstrapEmail,
            @Value("${app.admin.bootstrap-password:}") String bootstrapPassword
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.bootstrapEmail = bootstrapEmail;
        this.bootstrapPassword = bootstrapPassword;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (bootstrapEmail == null || bootstrapEmail.isBlank()
                || bootstrapPassword == null || bootstrapPassword.isBlank()) {
            return;
        }

        String normalizedEmail = bootstrapEmail.trim();
        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            return;
        }

        User admin = new User(
                "Platform",
                "Administrator",
                normalizedEmail,
                passwordEncoder.encode(bootstrapPassword),
                LocalDate.of(1990, 1, 1),
                "000-000-0000",
                "ADMIN"
        );
        admin.setEmailVerified(true);
        admin.setStatus("ACTIVE");
        admin.setCanPostListings(true);

        userRepository.save(admin);
        log.info("Bootstrapped initial ADMIN account for {}", normalizedEmail);
    }
}
