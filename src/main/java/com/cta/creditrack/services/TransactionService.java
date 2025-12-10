package com.cta.creditrack.services;

import java.text.SimpleDateFormat;
import java.util.Date;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cta.creditrack.auth.model.CustomUserDetials;
import com.cta.creditrack.model.Transaction;
import com.cta.creditrack.model.User;
import com.cta.creditrack.repository.TransactionRepository;
import com.cta.creditrack.utils.AuthUtil;

import io.micrometer.common.lang.Nullable;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;
    @Autowired
    private AuthUtil authUtil;



    private String generateTransactionNumber() {
        String date = new SimpleDateFormat("yyyyMMddHHmmssSSS").format(new Date());
        // "TXN-" + UUID.randomUUID().toString();
        return "TXN-" + date;
    }

    public void postTransaction(Transaction transaction, @Nullable Long userId) {
        
        if(userId == null) {
             CustomUserDetials user = authUtil.getCurrentUser();
            userId = user != null ? user.getUser().getId() : null;
        }

        String trxnNumber = generateTransactionNumber();
        transaction.setTransactionNumber(trxnNumber);
        transaction.setUserId(userId);
        transactionRepository.save(transaction);
        transactionRepository.flush();
        
    }

}
