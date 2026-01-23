package com.cta.creditrack.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.ColumnDefault;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "cta_file_upload")
@Getter
@Setter
public class FileUpload {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tor_filename", nullable = false)
    private String torFilename;

    @Column(name = "tor_file_type", nullable = false)
    private String torFileType;

    @Lob
    @Column(name = "tor_file_data", nullable = false, columnDefinition = "LONGBLOB")
    private byte[] torFileData;
    
    @Column(name = "tor_file_size")
    private Long torFileSize;

        @Column(name = "cd_filename", nullable = false)
    private String cdFilename;

    @Column(name = "cd_file_type", nullable = false)
    private String cdFileType;
    @Lob
    @Column(name = "cd_file_data", nullable = false, columnDefinition = "LONGBLOB")
    private byte[] cdFileData;
    
    @Column(name = "cd_file_size")
    private Long cdFileSize;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", referencedColumnName = "id", nullable = false)
    private Student student;

    @Column(name = "upload_date", nullable = false)
    private LocalDateTime uploadDate;



    public FileUpload() {
        this.uploadDate = LocalDateTime.now();
    }

    public FileUpload(String torFilename, String torFileType, byte[] torFileData, Long torFileSize, String cdFilename,
            String cdFileType, byte[] cdFileData, Long cdFileSize, Student student, LocalDateTime uploadDate) {
        this.torFilename = torFilename;
        this.torFileType = torFileType;
        this.torFileData = torFileData;
        this.torFileSize = torFileSize;
        this.cdFilename = cdFilename;
        this.cdFileType = cdFileType;
        this.cdFileData = cdFileData;
        this.cdFileSize = cdFileSize;
        this.student = student;
        this.uploadDate = LocalDateTime.now();
    }
}
