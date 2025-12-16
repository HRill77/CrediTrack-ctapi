package com.cta.creditrack.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cta.creditrack.model.Program;
import com.cta.creditrack.repository.ProgramRepository;

@Service
public class ProgramService {

    @Autowired
    private ProgramRepository programRepository;


    public List<Program> getAllPrograms() {
        return programRepository.findAll();
    }

}
