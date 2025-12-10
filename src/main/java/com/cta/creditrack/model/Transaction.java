package com.cta.creditrack.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "cta_transaction", indexes = {
        @Index(name = "idx_createdDate", columnList = "created_date") }, uniqueConstraints = @UniqueConstraint(columnNames = "transaction_number"))
@Getter
@Setter
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
@NoArgsConstructor
public class Transaction {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    @Column(name = "transaction_number")
    private String transactionNumber;

    @Column(name = "action_type")
    private String actionType;

    @Column(name = "module_component")
    private String moduleComponent;

    @Column(name = "action_details")
    private String actionDetails;

    @Column(columnDefinition = "LONGTEXT")
    private String response;

    @CreationTimestamp
    @Column(name = "created_date")
    private LocalDateTime createdDate;

}
