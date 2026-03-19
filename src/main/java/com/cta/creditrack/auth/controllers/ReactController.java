package com.cta.creditrack.auth.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import jakarta.servlet.http.HttpServletRequest;

@Controller
public class ReactController implements ErrorController {

    @Value("${gateway.url:http://localhost:8080}")
    private String gatewayUrl;

    private static final Logger log = LoggerFactory.getLogger(ReactController.class);

    @RequestMapping(value = {
            "/",
            "/dashboard/**",
            "/account",
            "/forgot-password",
            "/update-password"
    })
    public String redirect() {
        return "forward:/index.html";
    }

}
