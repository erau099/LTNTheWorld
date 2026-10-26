package com.codecraft.lovethyneighbor.security;

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
import java.util.Collections;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    // Inject your existing JwtService so the signing key always matches
    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
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

        // 3. Validate token using JwtService
        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                // Uses the exact same signing key and JJWT parser as your login system
                Claims claims = jwtService.parseToken(token);

                String userId = claims.getSubject();
                String rawRole = claims.get("role", String.class);

                if (userId != null) {
                    List<SimpleGrantedAuthority> authorities = Collections.emptyList();

                    if (rawRole != null) {
                        String formattedRole = rawRole.toUpperCase();
                        if (!formattedRole.startsWith("ROLE_")) {
                            formattedRole = "ROLE_" + formattedRole;
                        }
                        authorities = List.of(new SimpleGrantedAuthority(formattedRole));
                    }

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userId,
                                    null,
                                    authorities
                            );

                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (Exception ex) {
                System.out.println(">>> JWT FILTER AUTHENTICATION FAILED: " + ex.getMessage());
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }
}