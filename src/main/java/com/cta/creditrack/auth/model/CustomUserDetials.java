package com.cta.creditrack.auth.model;

import java.util.Collection;
import java.util.stream.Collectors;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.cta.creditrack.model.Role;
import com.cta.creditrack.model.User;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomUserDetials implements UserDetails {

    private final User user;

    public CustomUserDetials(User user) {
        this.user = user;
    }


    public Long getId() {
        return user.getId();
    }

    public String getEmail() {
        return user.getEmail();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
       return user.getRoles().stream()
       .map(Role::getRoleName)
       .map(Enum::name)
       .map(SimpleGrantedAuthority::new)
       .collect(Collectors.toSet());
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    @Override
    public String getUsername() {
        return user.getEmail();
    }

      @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { 
        // Default to true if isActive is null, otherwise use the value
        return user.getIsActive() == null ? true : user.getIsActive(); 
    }

    

}
