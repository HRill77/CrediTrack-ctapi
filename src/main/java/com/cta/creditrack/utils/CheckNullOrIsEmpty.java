package com.cta.creditrack.utils;

public class CheckNullOrIsEmpty {

     public static String isEmptyOrNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}
