package com.cta.creditrack.services;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;

import com.cta.creditrack.auth.model.CustomUserDetials;
import com.cta.creditrack.model.Transaction;
import com.cta.creditrack.model.User;
import com.cta.creditrack.repository.TransactionRepository;
import com.cta.creditrack.utils.AuthUtil;

import io.micrometer.common.lang.Nullable;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;
    @Autowired
    private AuthUtil authUtil;

    public String generateTransactionNumber() {
        String date = new SimpleDateFormat("yyyyMMddHHmmssSSS").format(new Date());
        String uniquePart = UUID.randomUUID().toString().substring(0, 8);
        return "TXN-" + date + "-" + uniquePart;
    }

    public void postTransaction(Transaction transaction, @Nullable Long userId) {

        if (userId == null) {
            CustomUserDetials user = authUtil.getCurrentUser();
            userId = user != null ? user.getUser().getId() : null;
        }

        String trxnNumber = generateTransactionNumber();
        transaction.setTransactionNumber(trxnNumber);
        transaction.setUserId(userId);
        transactionRepository.save(transaction);
        transactionRepository.flush();

    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logTransaction(Long userId,
            String transactionNumber,
            String actionType,
            String moduleComponent,
            String details,
            String response) {

        Transaction tx = new Transaction();
        tx.setUserId(userId);
        tx.setTransactionNumber(transactionNumber);
        tx.setActionType(actionType);
        tx.setModuleComponent(moduleComponent);
        tx.setActionDetails(details);
        tx.setResponse(response);

        transactionRepository.save(tx);
    }

}
