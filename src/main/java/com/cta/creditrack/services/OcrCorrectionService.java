package com.cta.creditrack.services;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class OcrCorrectionService {

    private static final Map<String, String> COMMON_FIXES = new HashMap<>();

    static {
        COMMON_FIXES.put("ClE", "CIE");
        COMMON_FIXES.put("cIE", "CIE");
        COMMON_FIXES.put("CI E", "CIE");
        COMMON_FIXES.put("0", "O");
        COMMON_FIXES.put("1ST", "1ST");
    }

    public String cleanToken(String token) {

        if (token == null) return "";

        token = token.trim();

        if (COMMON_FIXES.containsKey(token)) {
            return COMMON_FIXES.get(token);
        }

        // Fix subject code OCR confusion (O vs 0, I vs 1)
        if (token.matches("[A-Z]{2,6}")) {
            token = token.replace("0", "O");
            token = token.replace("1", "I");
        }

        return token;
    }
}
