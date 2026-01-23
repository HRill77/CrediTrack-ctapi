package com.cta.creditrack.enums;

public enum TransactionConstants {
    ACTION_SAVE("SAVE"),
    ACTION_UPLOAD("UPLOAD"),
    MODULE_STUDENT("STUDENT"),
    MODULE_TRANSFER("TRANSFER_DETAILS"),
    MODULE_FILE_UPLOAD("FILE_UPLOAD");

    private final String value;

    TransactionConstants(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
