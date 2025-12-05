package com.cta.creditrack;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CreditrackApplication implements CommandLineRunner {
	@Autowired
	private PopulateToDatabase populateToDatabase;

	public static void main(String[] args) {
		SpringApplication.run(CreditrackApplication.class, args);
	}

	public void run(String... args) throws Exception {
		populateToDatabase.insertPredefinedRoles();
	}

}
