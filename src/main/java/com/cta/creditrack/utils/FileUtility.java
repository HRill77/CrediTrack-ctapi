package com.cta.creditrack.utils;

import org.springframework.stereotype.Component;

@Component
public class FileUtility {

     private static final String[] ALLOWED_FILE_TYPES = {"application/pdf", "image/jpeg", "image/jpg"};
    public boolean isAllowedFileType(String contentType) {
        for (String allowedType : ALLOWED_FILE_TYPES) {
            if (contentType != null && contentType.equals(allowedType)) {
                return true;
            }
        }
        return false;
    }

}
