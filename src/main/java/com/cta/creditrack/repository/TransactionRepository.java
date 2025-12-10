package com.cta.creditrack.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cta.creditrack.model.Transaction;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    
    Transaction findByTransactionNumber(String transactionNumber);


    boolean existsByTransactionNumber(String transactionNumber);


}
