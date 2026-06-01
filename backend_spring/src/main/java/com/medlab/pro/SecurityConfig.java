package com.medlab.pro;

// This is a conceptual implementation of the Spring Security 
// configuration for a JWT-protected medical service.

/*
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf().disable()
            .authorizeHttpRequests()
            .requestMatchers("/api/insurance/**").hasRole("ADMIN")
            .requestMatchers("/api/billing/**").hasAnyRole("ADMIN", "CASHIER")
            .anyRequest().authenticated()
            .and()
            .oauth2ResourceServer().jwt(); // Use JWT for cross-service auth
            
        return http.build();
    }
}
*/
