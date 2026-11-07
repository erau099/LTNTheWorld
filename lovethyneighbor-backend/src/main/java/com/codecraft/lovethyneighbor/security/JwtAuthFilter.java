package com.codecraft.lovethyneighbor.security;

import com.codecraft.lovethyneighbor.User;
import com.codecraft.lovethyneighbor.UserRepository;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    // DT-134: Check current account status on authenticated requests
    public JwtAuthFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String token = null;

        // 1. Check for authToken inside incoming HTTP cookies
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("authToken".equals(cookie.getName())) {
                    token = cookie.getValue();
                    break;
                }
            }
        }

        // 2. Fallback to Authorization header if no cookie is present
        if (token == null) {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
        }

        // 3. Validate token using JwtService and verify user status in DB
        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                Claims claims = jwtService.parseToken(token);
                String userId = claims.getSubject();

                if (userId != null) {
                    UUID id = UUID.fromString(userId);
                    Optional<User> userOpt = userRepository.findById(id);

                    if (userOpt.isPresent()) {
                        User user = userOpt.get();

                        // Reject existing sessions for blocked/inactive accounts (DT-134)
                        if ("ACTIVE".equalsIgnoreCase(user.getStatus()) && user.getRole() != null) {
                            String role = user.getRole();
                            String formattedRole = role.toUpperCase(Locale.ROOT);
                            if (!formattedRole.startsWith("ROLE_")) {
                                formattedRole = "ROLE_" + formattedRole;
                            }

                            UsernamePasswordAuthenticationToken authentication =
                                    new UsernamePasswordAuthenticationToken(
                                            userId,
                                            null,
                                            List.of(new SimpleGrantedAuthority(formattedRole))
                                    );

                            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                        } else {
                            SecurityContextHolder.clearContext();
                        }
                    } else {
                        SecurityContextHolder.clearContext();
                    }
                }
            } catch (Exception ex) {
                System.out.println(">>> JWT FILTER AUTHENTICATION FAILED: " + ex.getMessage());
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }
}