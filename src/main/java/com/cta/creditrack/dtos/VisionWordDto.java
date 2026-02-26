package com.cta.creditrack.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VisionWordDto {


    private String text;
    private int x;
    private int y;

    public VisionWordDto(String text, int x, int y) {
        this.text = text;
        this.x = x;
        this.y = y;
    }

  

}
