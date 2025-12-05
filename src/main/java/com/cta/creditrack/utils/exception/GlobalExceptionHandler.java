package com.cta.creditrack.utils.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import com.cta.creditrack.dtos.ApiErrorResponse;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest req) {

        String message = ex.getBindingResult().getFieldErrors().stream()
            .map(fe -> fe.getField() + " " + fe.getDefaultMessage())
            .findFirst().orElse("Validation error");

        ApiErrorResponse body = new ApiErrorResponse(
            400, "Bad Request", message, req.getRequestURI()
        );
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiErrorResponse> handleBadCredentials(
            BadCredentialsException ex,
            HttpServletRequest req) {

        ApiErrorResponse body = new ApiErrorResponse(
            401, "Unauthorized", "Invalid username or password", req.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgument(
            IllegalArgumentException ex,
            HttpServletRequest req) {

        // For duplicate username/email during registration, return 409
        HttpStatus status = ex.getMessage() != null &&
                (ex.getMessage().contains("already in use"))
                    ? HttpStatus.CONFLICT
                    : HttpStatus.BAD_REQUEST;

        ApiErrorResponse body = new ApiErrorResponse(
            status.value(),
            status.getReasonPhrase(),
            ex.getMessage(),
            req.getRequestURI()
        );
        return ResponseEntity.status(status).body(body);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiErrorResponse> handleAuthGeneric(
            AuthenticationException ex,
            HttpServletRequest req) {

        ApiErrorResponse body = new ApiErrorResponse(
            401, "Unauthorized", ex.getMessage(), req.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGeneric(
            Exception ex,
            HttpServletRequest req) {
        ApiErrorResponse body = new ApiErrorResponse(
            500, "Internal Server Error", ex.getMessage(), req.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}

