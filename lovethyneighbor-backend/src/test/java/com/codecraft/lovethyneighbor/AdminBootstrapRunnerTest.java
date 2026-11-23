package com.codecraft.lovethyneighbor;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminBootstrapRunnerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Test
    void skipsWhenEnvCredentialsAreUnset() {
        AdminBootstrapRunner runner = new AdminBootstrapRunner(userRepository, passwordEncoder, "", "");
        runner.run(null);
        verifyNoInteractions(userRepository);
    }

    @Test
    void createsVerifiedAdminWhenConfiguredAndMissing() {
        when(userRepository.findByEmail("admin@ltn.org")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("StrongAdminPass123!")).thenReturn("bcrypt-hash");

        AdminBootstrapRunner runner = new AdminBootstrapRunner(
                userRepository, passwordEncoder, "admin@ltn.org", "StrongAdminPass123!");
        runner.run(null);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertEquals("ADMIN", saved.getRole());
        assertEquals("ACTIVE", saved.getStatus());
        assertTrue(saved.isEmailVerified());
        assertEquals("bcrypt-hash", saved.getPassword());
    }

    @Test
    void skipsIfAdminAccountAlreadyExists() {
        when(userRepository.findByEmail("admin@ltn.org")).thenReturn(Optional.of(new User()));

        AdminBootstrapRunner runner = new AdminBootstrapRunner(
                userRepository, passwordEncoder, "admin@ltn.org", "StrongAdminPass123!");
        runner.run(null);

        verify(userRepository, never()).save(any());
    }
}
