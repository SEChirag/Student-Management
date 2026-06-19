package main.java.com.test.Exceptions;


import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

   @ExceptionHandler(StudentNotFoundException.class)
    public ResponseEntity<String> handleException(StudentNotFoundException ex ) {

       return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());

    }
}