package com.codecraft.lovethyneighbor.security;

import com.codecraft.lovethyneighbor.User;
import com.codecraft.lovethyneighbor.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthFilterTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @Mock
    private Claims claims;

    @InjectMocks
    private JwtAuthFilter jwtAuthFilter;

    private UUID userId;
    private User activeUser;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        userId = UUID.randomUUID();

        activeUser = new User();
        activeUser.setId(userId);
        activeUser.setRole("donor");
        activeUser.setStatus("ACTIVE");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Should authenticate via authToken cookie when account is ACTIVE")
    void shouldAuthenticateViaCookie() throws ServletException, IOException {
        Cookie authCookie = new Cookie("authToken", "valid-cookie-token");
        given(request.getCookies()).willReturn(new Cookie[]{authCookie});

        given(jwtService.parseToken("valid-cookie-token")).willReturn(claims);
        given(claims.getSubject()).willReturn(userId.toString());
        given(userRepository.findById(userId)).willReturn(Optional.of(activeUser));

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        assertEquals(userId.toString(), auth.getPrincipal().toString());
        assertTrue(auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_DONOR")));

        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Should authenticate via Authorization: Bearer header when no cookie present")
    void shouldAuthenticateViaBearerHeader() throws ServletException, IOException {
        given(request.getCookies()).willReturn(null);
        given(request.getHeader("Authorization")).willReturn("Bearer valid-header-token");

        given(jwtService.parseToken("valid-header-token")).willReturn(claims);
        given(claims.getSubject()).willReturn(userId.toString());
        given(userRepository.findById(userId)).willReturn(Optional.of(activeUser));

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        assertEquals(userId.toString(), auth.getPrincipal().toString());

        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Should clear context if account status is SUSPENDED (DT-134)")
    void shouldRejectSuspendedAccount() throws ServletException, IOException {
        activeUser.setStatus("SUSPENDED");

        Cookie authCookie = new Cookie("authToken", "valid-token");
        given(request.getCookies()).willReturn(new Cookie[]{authCookie});
        given(jwtService.parseToken("valid-token")).willReturn(claims);
        given(claims.getSubject()).willReturn(userId.toString());
        given(userRepository.findById(userId)).willReturn(Optional.of(activeUser));

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Should continue filter chain without authentication when no token provided")
    void shouldContinueWhenNoTokenProvided() throws ServletException, IOException {
        given(request.getCookies()).willReturn(null);
        given(request.getHeader("Authorization")).willReturn(null);

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
    }
}