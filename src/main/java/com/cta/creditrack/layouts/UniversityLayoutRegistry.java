package com.cta.creditrack.layouts;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class UniversityLayoutRegistry {

    private final Map<String, UniversityLayout> layouts = new HashMap<>();

//     public UniversityLayoutRegistry() {

//         // NEUST Layout Example
//         layouts.put("NEUST",
//                 new UniversityLayout(
//                         "NEUST",
//                         0, 350,
//                         350, 1600,
//                         1600, 1900,
//                         1900, 2200
//                 ));

//         // ARAULLO Layout Example
//         layouts.put("ARAULLO",
//                 new UniversityLayout(
//                         "ARAULLO",
//                         0, 250,
//                         250, 650,
//                         650, 820,
//                         820, 1000
//                 ));
//     }

    public UniversityLayout getLayout(String universityCode) {
        return layouts.get(universityCode);
    }
}
