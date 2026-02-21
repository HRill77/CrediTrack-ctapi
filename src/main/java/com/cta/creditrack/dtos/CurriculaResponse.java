package com.cta.creditrack.dtos;

public class CurriculaResponse {
    
    private Long id;
    private String programTitle;
    private String programCode;
    private String year;
    private String semester;
    private String courseCode;
    private String courseTitle;
    private String preRequisite;
    private Integer lec;
    private Integer lab;
    private Integer units;

    // Constructor
    public CurriculaResponse(
            Long id,
            String programTitle,
            String programCode,
            String year,
            String semester,
            String courseCode,
            String courseTitle,
            String preRequisite,
            Integer lec,
            Integer lab,
            Integer units) {
        this.id = id;
        this.programTitle = programTitle;
        this.programCode = programCode;
        this.year = year;
        this.semester = semester;
        this.courseCode = courseCode;
        this.courseTitle = courseTitle;
        this.preRequisite = preRequisite;
        this.lec = lec;
        this.lab = lab;
        this.units = units;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getProgramTitle() {
        return programTitle;
    }

    public void setProgramTitle(String programTitle) {
        this.programTitle = programTitle;
    }

    public String getProgramCode() {
        return programCode;
    }

    public void setProgramCode(String programCode) {
        this.programCode = programCode;
    }

    public String getYear() {
        return year;
    }

    public void setYear(String year) {
        this.year = year;
    }

    public String getSemester() {
        return semester;
    }

    public void setSemester(String semester) {
        this.semester = semester;
    }

    public String getCourseCode() {
        return courseCode;
    }

    public void setCourseCode(String courseCode) {
        this.courseCode = courseCode;
    }

    public String getCourseTitle() {
        return courseTitle;
    }

    public void setCourseTitle(String courseTitle) {
        this.courseTitle = courseTitle;
    }

    public String getPreRequisite() {
        return preRequisite;
    }

    public void setPreRequisite(String preRequisite) {
        this.preRequisite = preRequisite;
    }

    public Integer getLec() {
        return lec;
    }

    public void setLec(Integer lec) {
        this.lec = lec;
    }

    public Integer getLab() {
        return lab;
    }

    public void setLab(Integer lab) {
        this.lab = lab;
    }

    public Integer getUnits() {
        return units;
    }

    public void setUnits(Integer units) {
        this.units = units;
    }
}
