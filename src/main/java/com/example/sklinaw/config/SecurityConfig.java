package com.example.sklinaw.config;

import java.util.Arrays;

import javax.sql.DataSource;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
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
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
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
                .requestMatchers("/admin/fix-developer-passwords").permitAll()
                
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
            
            // ✅ Session management (correct placement)
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                .invalidSessionUrl("/api/login?expired=true")
                .maximumSessions(1)
                .maxSessionsPreventsLogin(false)
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
            "https://*.ngrok.io",
            "https://*.onrender.com",      
            "https://sklinaw.onrender.com",
            "https://sklinaw.vercel.app",   
            "https://*.vercel.app"  
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
        
        // Check if running on Render (PostgreSQL) or local (SQLite)
        String dbUrl = System.getenv("DB_URL");
        
        if (dbUrl != null && !dbUrl.isEmpty()) {
            // PostgreSQL syntax (no changes needed, same as SQLite for these queries)
            users.setUsersByUsernameQuery(
                "SELECT username, password, enabled FROM (" +
                "SELECT Name as username, Password as password, approved as enabled FROM Councilors " +
                "UNION ALL " +
                "SELECT Name as username, Password as password, approved as enabled FROM Developer" +
                ") AS all_users WHERE username = ?"
            );
            
            users.setAuthoritiesByUsernameQuery(
                "SELECT username, authority FROM (" +
                "SELECT Name as username, 'ROLE_' || privilege as authority FROM Councilors WHERE privilege IS NOT NULL AND privilege != '' " +
                "UNION ALL " +
                "SELECT Name as username, 'ROLE_COUNCILOR' as authority FROM Councilors WHERE (privilege IS NULL OR privilege = '') " +
                "UNION ALL " +
                "SELECT Name as username, 'ROLE_' || privilege as authority FROM Developer WHERE privilege IS NOT NULL AND privilege != ''" +
                ") AS all_authorities WHERE username = ?"
            );
        } else {
            // SQLite syntax (same queries work)
            users.setUsersByUsernameQuery(
                "SELECT username, password, enabled FROM (" +
                "SELECT Name as username, Password as password, approved as enabled FROM Councilors " +
                "UNION ALL " +
                "SELECT Name as username, Password as password, approved as enabled FROM Developer" +
                ") AS all_users WHERE username = ?"
            );
            
            users.setAuthoritiesByUsernameQuery(
                "SELECT username, authority FROM (" +
                "SELECT Name as username, 'ROLE_' || privilege as authority FROM Councilors WHERE privilege IS NOT NULL AND privilege != '' " +
                "UNION ALL " +
                "SELECT Name as username, 'ROLE_COUNCILOR' as authority FROM Councilors WHERE (privilege IS NULL OR privilege = '') " +
                "UNION ALL " +
                "SELECT Name as username, 'ROLE_' || privilege as authority FROM Developer WHERE privilege IS NOT NULL AND privilege != ''" +
                ") AS all_authorities WHERE username = ?"
            );
        }
        
        users.setEnableGroups(false);
        return users;
    }

    @Bean
    public DataSource dataSource() {
        // Check if running on Render (PostgreSQL) or local (SQLite)
        String dbUrl = System.getenv("DB_URL");
        
        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        
        if (dbUrl != null && !dbUrl.isEmpty()) {
            // Running on Render - use PostgreSQL
            System.out.println("Using PostgreSQL database for production");
            dataSource.setDriverClassName("org.postgresql.Driver");
            dataSource.setUrl(dbUrl);
            dataSource.setUsername(System.getenv("DB_USER"));
            dataSource.setPassword(System.getenv("DB_PASS"));
        } else {
            // Local development - use SQLite
            System.out.println("Using SQLite database for local development");
            dataSource.setDriverClassName("org.sqlite.JDBC");
            dataSource.setUrl("jdbc:sqlite:sklinaw.db");
            dataSource.setUsername("");
            dataSource.setPassword("");
        }
        
        return dataSource;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}