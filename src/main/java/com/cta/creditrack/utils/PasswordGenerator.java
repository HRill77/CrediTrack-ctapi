package com.cta.creditrack.utils;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

public class PasswordGenerator {
    private static final String UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String LOWERCASE = UPPERCASE.toLowerCase();
    private static final String DIGITS = "0123456789";
    private static final String SPECIAL_CHARACTERS = "!@#$%^&*(),.?\\\"':{}|<>~`";

    private static SecureRandom random = new SecureRandom();

    public static String generatePassword(){
        return generatePassword(12);
    }

    public static String generatePassword(int length) {
        if (length < 8) {
            throw new IllegalArgumentException("Password length must be at least 8 characters.");
        }

        StringBuilder password = new StringBuilder(length);
        List<Character> characters = new ArrayList<>();

        // Ensure the password has at least one character from each category
        characters.add(UPPERCASE.charAt(random.nextInt(UPPERCASE.length())));
        characters.add(LOWERCASE.charAt(random.nextInt(LOWERCASE.length())));
        characters.add(DIGITS.charAt(random.nextInt(DIGITS.length())));
        characters.add(SPECIAL_CHARACTERS.charAt(random.nextInt(SPECIAL_CHARACTERS.length())));

        String allCharacters = UPPERCASE + LOWERCASE + DIGITS + SPECIAL_CHARACTERS;

        for (int i = characters.size(); i < length; i++) {
            characters.add(allCharacters.charAt(random.nextInt(allCharacters.length())));
        }

        // Shuffle the characters to ensure randomness
        Collections.shuffle(characters);
        for(Character c : characters) {
            password.append(c);
        }

        return password.toString();
    }


}
