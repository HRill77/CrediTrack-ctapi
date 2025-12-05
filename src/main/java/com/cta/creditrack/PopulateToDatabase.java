package com.cta.creditrack;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.cta.creditrack.services.RoleService;

@Component
public class PopulateToDatabase {

    @Autowired
    private RoleService roleService;

    public void insertPredefinedRoles() {
        roleService.insertPredefinedRoles();
    }

}
