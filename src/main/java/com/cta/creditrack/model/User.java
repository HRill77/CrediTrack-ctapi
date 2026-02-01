package com.cta.creditrack.model;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Getter
@Setter
@Table(name = "cta_user")
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String firstname;
    private String middlename;
    private String lastname;
    private String suffix;
    private String phoneNumber;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(nullable = false)
    private Boolean isActive = true;

    /** Forces user to change password on login */
    @Column(nullable = false)
    private Boolean mustChangePassword = true;

    /** When the current password was set */
    @Column(name = "password_set_at", nullable = false)
    private Instant passwordSetAt;

    /** Optional: when temp password expires */
    @Column(name = "password_expires_at")
    private Instant passwordExpiresAt;

        @Column(name = "filename", nullable = false)
    private String filename;

    @Column(name = "file_type", nullable = false)
    private String fileType;
    @Lob
    @Column(name = "file_data", nullable = false, columnDefinition = "LONGBLOB")
    private byte[] fileData;
    
    @Column(name = "file_size")
    private Long fileSize;

     // ---------------- RELATIONS ----------------

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "cta_users_program", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "program_id"))
    @Builder.Default
    private Set<Program> programs = new HashSet<>();

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "cta_users_roles", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "role_id"))
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
        passwordSetAt = now;
        // Set password to expire in 24 hours
        passwordExpiresAt = now.plusSeconds(24 * 60 * 60);
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }

}
