package com.example.sklinaw.config;

import java.util.Arrays;

import javax.sql.DataSource;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.JdbcUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF for API
            .csrf(csrf -> csrf.disable())
            
            // Configure CORS with proper settings
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // Configure authorization rules
            .authorizeHttpRequests(auth -> auth
                // ========== PUBLIC HTML PAGES ==========
                .requestMatchers("/Councilor/Home/**").permitAll()
                .requestMatchers("/Councilor/Log-in/**").permitAll()
                .requestMatchers("/Councilor/Sign-in/**").permitAll()
                .requestMatchers("/Public/**").permitAll()
                .requestMatchers("/index.html").permitAll()
                .requestMatchers("/home.html").permitAll()
                
                // ========== STATIC RESOURCES ==========
                .requestMatchers("/Shared/**").permitAll()
                .requestMatchers("/**/*.css").permitAll()
                .requestMatchers("/**/*.js").permitAll()
                .requestMatchers("/**/*.png").permitAll()
                .requestMatchers("/**/*.jpg").permitAll()
                .requestMatchers("/**/*.jpeg").permitAll()
                .requestMatchers("/**/*.gif").permitAll()
                .requestMatchers("/**/*.svg").permitAll()
                .requestMatchers("/**/*.ico").permitAll()
                .requestMatchers("/**/*.webmanifest").permitAll()
                
                // ========== PUBLIC API ENDPOINTS ==========
                .requestMatchers("/api/addAccount").permitAll()      
                .requestMatchers("/api/submitCredentials").permitAll()
                .requestMatchers("/api/login").permitAll()
                .requestMatchers("/api/logout").permitAll()
                .requestMatchers("/api/auth/session").permitAll()
                .requestMatchers("/api/getPublicProjects").permitAll()
                .requestMatchers("/api/getFeedback").permitAll()
                .requestMatchers("/api/submitFeedback").permitAll()
                .requestMatchers("/api/submitProjectComment").permitAll()  
                .requestMatchers("/api/getProjectComments").permitAll()
                .requestMatchers("/api/getCommittees").permitAll()
                .requestMatchers("/api/getProjects").permitAll()
                .requestMatchers("/api/getBudget").permitAll()
                .requestMatchers("/api/getUserInfo").permitAll()
                .requestMatchers("/api/public/getBarangays").permitAll()
                .requestMatchers("/api/getProjectRating").permitAll()
                .requestMatchers("/api/submitScore").permitAll()
                .requestMatchers("/api/getProjectScore").permitAll()
                .requestMatchers("/api/getAllProjectScores").permitAll()
                
                // ========== OPTIONS REQUESTS (CORS Preflight) ==========
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                
                // ========== ADMIN ENDPOINTS ==========
                .requestMatchers("/admin/**").hasRole("ADMIN")
                
                // ========== CHAIRMAN ENDPOINTS ==========
                .requestMatchers("/api/approveProject").hasRole("CHAIRMAN")
                .requestMatchers("/api/rejectProject").hasRole("CHAIRMAN")
                .requestMatchers("/api/getPendingProjects").hasRole("CHAIRMAN")
                .requestMatchers("/api/createCommittee").hasRole("CHAIRMAN")
                .requestMatchers("/api/assignCommitteeHead").hasRole("CHAIRMAN")
                .requestMatchers("/api/setBudget").hasAnyRole("CHAIRMAN", "TREASURER")
                
                // ========== TREASURER ENDPOINTS ==========
                .requestMatchers("/api/setBudget").hasAnyRole("CHAIRMAN", "TREASURER")
                
                // ========== COUNCILOR ENDPOINTS ==========
                .requestMatchers("/api/addProject").authenticated()
                .requestMatchers("/api/addCommitteeMember").authenticated()
                .requestMatchers("/api/removeCommitteeMember").authenticated()
                
                // All other requests require authentication
                .anyRequest().authenticated()
            )
            
            // Session management
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            )
            
            // Disable HTTP Basic (use session-based auth)
            .httpBasic(httpBasic -> httpBasic.disable())
            .formLogin(form -> form.disable());
        
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Use allowedOriginPatterns for credentials with wildcards
        configuration.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:3000",
            "http://localhost:5500",
            "http://localhost:8080",
            "http://127.0.0.1:5500",
            "http://127.0.0.1:8080",
            "https://*.ngrok-free.dev",
            "https://*.ngrok.io"
        ));
        
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "Accept",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers",
            "ngrok-skip-browser-warning"
        ));
        configuration.setExposedHeaders(Arrays.asList("Access-Control-Allow-Origin", "Access-Control-Allow-Credentials"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public UserDetailsService userDetailsService(DataSource dataSource) {
        JdbcUserDetailsManager users = new JdbcUserDetailsManager(dataSource);
        
        // Query for both Councilors and Developer tables (for authentication)
        users.setUsersByUsernameQuery(
            "SELECT username, password, enabled FROM (" +
            "SELECT Name as username, Password as password, approved as enabled FROM Councilors " +
            "UNION ALL " +
            "SELECT Name as username, Password as password, approved as enabled FROM Developer" +
            ") AS all_users WHERE username = ?"
        );
        
        // Query for authorities - returns ROLE_COUNCILOR for regular councilors
        users.setAuthoritiesByUsernameQuery(
            "SELECT username, authority FROM (" +
            "SELECT Name as username, 'ROLE_' || privilege as authority FROM Councilors WHERE privilege IS NOT NULL AND privilege != '' " +
            "UNION ALL " +
            "SELECT Name as username, 'ROLE_COUNCILOR' as authority FROM Councilors WHERE (privilege IS NULL OR privilege = '') " +
            "UNION ALL " +
            "SELECT Name as username, 'ROLE_' || privilege as authority FROM Developer WHERE privilege IS NOT NULL AND privilege != ''" +
            ") AS all_authorities WHERE username = ?"
        );
        
        users.setEnableGroups(false);
        return users;
    }

    @Bean
    public DataSource dataSource() {
        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setDriverClassName("org.sqlite.JDBC");
        dataSource.setUrl("jdbc:sqlite:C:/Users/91460/.SKLinaw/SKLinaw/SKLinaw.db");
        // SQLite doesn't use username/password
        dataSource.setUsername("");
        dataSource.setPassword("");
        return dataSource;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(UserDetailsService userDetailsService, PasswordEncoder passwordEncoder) {
        // Alternative approach without DaoAuthenticationProvider
        org.springframework.security.authentication.AuthenticationManager authManager = 
            authentication -> {
                try {
                    return new UsernamePasswordAuthenticationToken(
                        userDetailsService.loadUserByUsername(authentication.getName()),
                        null,
                        userDetailsService.loadUserByUsername(authentication.getName()).getAuthorities()
                    );
                } catch (Exception e) {
                    throw new org.springframework.security.authentication.BadCredentialsException("Invalid credentials");
                }
            };
        return authManager;
    }
}