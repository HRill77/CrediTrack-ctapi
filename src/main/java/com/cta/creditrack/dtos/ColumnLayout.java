package com.cta.creditrack.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ColumnLayout {
 int subjectX;
    int gradeX;
    int creditX;

   public ColumnLayout(int subjectX, int gradeX, int creditX) {
        this.subjectX = subjectX;
        this.gradeX = gradeX;
        this.creditX = creditX;
    }
}
