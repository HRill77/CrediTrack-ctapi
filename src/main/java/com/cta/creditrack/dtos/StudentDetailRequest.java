package com.cta.creditrack.dtos;

import io.micrometer.common.lang.Nullable;
import jakarta.validation.constraints.Null;

public record StudentDetailRequest(
    String firstname,
    String lastname,
    @Nullable String middlename,
    @Nullable String suffix,
    String email,
    String phone,
    String address,
    String yearLevel,
    String dob
      

) {

}
