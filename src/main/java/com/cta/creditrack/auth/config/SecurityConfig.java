package com.cta.creditrack.auth.config;

import lombok.RequiredArgsConstructor;


import java.util.*;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.*;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.cta.creditrack.auth.services.CustomUserDetailsService;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;

    @Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .csrf(csrf -> csrf.disable())
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .sessionManagement(session -> session
            .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
        )
        .authorizeHttpRequests(auth -> 
            auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
              .requestMatchers("/api/auth/register", "/api/auth/login", "/api/auth/check-temp-password", "/api/auth/update-temp-password",
              "/api/auth/forgot-password", "/api/ingest/curricula", "/api/student/**" ,"/api/files/**" ,"/api/ingest/**", "/api/transcripts/**", "/api/document-ai/**", "/api/transcript-evaluation/**", "/api/curricula/list/by-program-and-course-title/**", 
            "/api/**" ).permitAll()
              .requestMatchers("/api/auth/**").hasAnyAuthority("ROLE_SUPER_ADMIN", "ROLE_USER", "ROLE_ADMIN", "ROLE_PROGRAM_HEAD")
              .anyRequest().authenticated()
        )
        .authenticationProvider(daoAuthProvider())
        .exceptionHandling(ex -> ex
            .authenticationEntryPoint((req, res, e) -> res.sendError(401, "Unauthorized"))
            .accessDeniedHandler((req, res, e) -> res.sendError(403, "Forbidden"))
        );

    return http.build();
}


    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of(
                "http://localhost:9997",
                "http://localhost:3000"));
        configuration.setAllowedMethods(List.of(
                "GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    // @Bean
    // FilterRegistrationBean<CorsFilter> corsFilter() {
    // FilterRegistrationBean<CorsFilter> filterRegistrationBean = new
    // FilterRegistrationBean<>();
    // filterRegistrationBean.setFilter(new CorsFilter(corsConfigurationSource()));
    // filterRegistrationBean.setOrder(Ordered.HIGHEST_PRECEDENCE);
    // return filterRegistrationBean;
    // }

    @Bean
    public DaoAuthenticationProvider daoAuthProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12); // strong bcrypt
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }
}
