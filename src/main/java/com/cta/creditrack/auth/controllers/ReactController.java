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

    @Value("${gateway.url:http://localhost:3000}")
    private String gatewayUrl;

    private static final Logger log = LoggerFactory.getLogger(ReactController.class);

    @RequestMapping(value = "/")
    public String redirect(HttpServletRequest request, Authentication authentication) {
        log.info("Redirecting to React frontend");
        return "forward:/index.html";
    }

}
