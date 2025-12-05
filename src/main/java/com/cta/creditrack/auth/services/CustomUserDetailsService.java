package com.cta.creditrack.auth.services;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.cta.creditrack.auth.model.CustomUserDetials;
import com.cta.creditrack.model.User;
import com.cta.creditrack.repository.UserRepository;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
       User user = userRepository.findByEmail(username)
        .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
       return new CustomUserDetials(user);
    }

}
