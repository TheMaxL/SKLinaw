package com.example.sklinaw.config;

import java.io.IOException;
import java.util.Arrays;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Autowired;
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
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .addFilterBefore(tokenAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)
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
                .requestMatchers("/api/check-auth").permitAll()
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
                .requestMatchers("/api/getAllProjects").authenticated()
                .requestMatchers("/api/getCommitteeProjects").authenticated()
                .requestMatchers("/api/getProjectsByCouncilor").authenticated()
                .requestMatchers("/api/getProjects").authenticated()
                .requestMatchers("/api/updateProject").authenticated()
                .requestMatchers("/api/deleteProject").authenticated()
                .requestMatchers("/api/approveProject").hasRole("CHAIRMAN")
                .requestMatchers("/api/rejectProject").hasRole("CHAIRMAN")
                
                // All other requests require authentication
                .anyRequest().authenticated()
            )
            
            .httpBasic(httpBasic -> httpBasic.disable())
            .formLogin(form -> form.disable());
        
        return http.build();
    }
    
    @Bean
    public Filter tokenAuthenticationFilter() {
        return new Filter() {
            @Override
            public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
                    throws IOException, ServletException {
                HttpServletRequest httpRequest = (HttpServletRequest) request;
                String authHeader = httpRequest.getHeader("Authorization");
                
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7);
                    
                    // Access the token map from AuthController using reflection
                    try {
                        Class<?> authControllerClass = Class.forName("com.example.sklinaw.controller.AuthController");
                        java.lang.reflect.Field field = authControllerClass.getDeclaredField("activeTokens");
                        field.setAccessible(true);
                        @SuppressWarnings("unchecked")
                        Map<String, Map<String, Object>> activeTokens = (Map<String, Map<String, Object>>) field.get(null);
                        
                        Map<String, Object> sessionData = activeTokens.get(token);
                        
                        if (sessionData != null) {
                            String name = (String) sessionData.get("name");
                            String privilege = (String) sessionData.get("privilege");
                            
                            org.springframework.security.core.authority.SimpleGrantedAuthority authority = 
                                new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + privilege);
                            
                            org.springframework.security.authentication.UsernamePasswordAuthenticationToken authentication = 
                                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                                    name, null, java.util.Collections.singletonList(authority));
                            
                            org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(authentication);
                            System.out.println("Token authenticated for: " + name + " with role: ROLE_" + privilege);
                        } else {
                            System.out.println("Invalid token: " + token);
                        }
                    } catch (Exception e) {
                        System.err.println("Error accessing token map: " + e.getMessage());
                    }
                }
                
                chain.doFilter(request, response);
            }
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        configuration.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:3000",
            "http://localhost:5500",
            "https://sklinaw.vercel.app",
            "https://*.vercel.app",
            "https://sklinaw.onrender.com",
            "https://your-netlify-site.netlify.app",     // ← Add your Netlify URL
            "https://*.netlify.app" 
        ));
        
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"));
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "Accept",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers"
        ));
        configuration.setExposedHeaders(Arrays.asList(
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Credentials"
        ));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public UserDetailsService userDetailsService(DataSource dataSource) {
        JdbcUserDetailsManager users = new JdbcUserDetailsManager(dataSource);
        
        String dbUrl = System.getenv("DB_URL");
        
        if (dbUrl != null && !dbUrl.isEmpty()) {
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
        String dbUrl = System.getenv("DB_URL");
        
        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        
        if (dbUrl != null && !dbUrl.isEmpty()) {
            System.out.println("Using PostgreSQL database for production");
            dataSource.setDriverClassName("org.postgresql.Driver");
            dataSource.setUrl(dbUrl);
            dataSource.setUsername(System.getenv("DB_USER"));
            dataSource.setPassword(System.getenv("DB_PASS"));
        } else {
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