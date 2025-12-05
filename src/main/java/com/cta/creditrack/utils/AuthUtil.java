package com.cta.creditrack.utils;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.cta.creditrack.auth.model.CustomUserDetials;

@Component
public class AuthUtil {

    public static CustomUserDetials getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.isAuthenticated() 
            && authentication.getPrincipal() instanceof CustomUserDetials) {
            return (CustomUserDetials) authentication.getPrincipal();
        }
        
        return null;
    }

    public static String getCurrentUsername() {
        CustomUserDetials user = getCurrentUser();
        return user != null ? user.getUsername() : null;
    }

    public static String getCurrentEmail() {
        CustomUserDetials user = getCurrentUser();
        return user != null ? user.getEmail() : null;
    }
}
