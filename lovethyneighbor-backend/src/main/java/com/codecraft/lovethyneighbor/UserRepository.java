package com.codecraft.lovethyneighbor;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, java.util.UUID> {
    Optional<User> findByEmail(String email);

    Optional<User> findByResetTokenHash(String resetTokenHash);

    // DT-332: look up the account a verification link belongs to
    Optional<User> findByVerificationTokenHash(String verificationTokenHash);
}