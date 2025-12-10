package com.cta.creditrack.auth.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.cta.creditrack.auth.model.CustomUserDetials;
import com.cta.creditrack.model.User;
import com.cta.creditrack.repository.UserRepository;

@Slf4j
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
       log.debug("Loading user details for username: {}", username);
       User user = userRepository.findByEmail(username)
        .orElseThrow(() -> {
            log.warn("User not found with email: {}", username);
            return new UsernameNotFoundException("User not found with username: " + username);
        });
       
       log.debug("User found: {}, isActive: {}, roles: {}", user.getEmail(), user.getIsActive(), user.getRoles().size());
       return new CustomUserDetials(user);
    }

}
