# File Upload API - Postman Testing Guide

## Setup Instructions

1. **Database Table**: MariaDB will create the `cta_file_upload` table automatically (Hibernate JPA)

2. **Build & Run**: Ensure your Spring Boot application is running on `http://localhost:8080`

---

## API Endpoints

### 1. Upload File
**Endpoint**: `POST /api/files/upload`

**Steps in Postman**:
1. Create new request
2. Method: **POST**
3. URL: `http://localhost:8080/api/files/upload`
4. Go to **Body** tab → Select **form-data**
5. Add parameters:
   - **file** (type: File) - Select your PDF or JPEG file
   - **studentId** (type: text) - Enter a student ID (e.g., `1`)
   - **description** (type: text, optional) - Enter a description

6. Click **Send**

**Expected Response**:
```json
{
    "success": true,
    "message": "File uploaded successfully",
    "fileId": 1,
    "filename": "document.pdf",
    "fileType": "application/pdf",
    "fileSize": 2048576,
    "uploadDate": "2026-01-19T10:30:45"
}
```

---

### 2. Get File (Download)
**Endpoint**: `GET /api/files/{fileId}`

**Steps in Postman**:
1. Create new request
2. Method: **GET**
3. URL: `http://localhost:8080/api/files/1` (replace `1` with actual file ID)
4. Click **Send**
5. File will download automatically

---

### 3. Get All Files for a Student
**Endpoint**: `GET /api/files/student/{studentId}`

**Steps in Postman**:
1. Create new request
2. Method: **GET**
3. URL: `http://localhost:8080/api/files/student/1` (replace `1` with actual student ID)
4. Click **Send**

**Expected Response**:
```json
{
    "success": true,
    "studentId": 1,
    "fileCount": 2,
    "files": [
        {
            "id": 1,
            "filename": "document.pdf",
            "fileType": "application/pdf",
            "fileSize": 2048576,
            "studentId": 1,
            "uploadDate": "2026-01-19T10:30:45",
            "description": "Transcript"
        },
        {
            "id": 2,
            "filename": "photo.jpg",
            "fileType": "image/jpeg",
            "fileSize": 512000,
            "studentId": 1,
            "uploadDate": "2026-01-19T10:32:10",
            "description": "Profile photo"
        }
    ]
}
```

---

### 4. Delete File
**Endpoint**: `DELETE /api/files/{fileId}`

**Steps in Postman**:
1. Create new request
2. Method: **DELETE**
3. URL: `http://localhost:8080/api/files/1` (replace `1` with actual file ID)
4. Click **Send**

**Expected Response**:
```json
{
    "success": true,
    "message": "File deleted successfully"
}
```

---

### 5. Health Check
**Endpoint**: `GET /api/files/health`

**Steps in Postman**:
1. Create new request
2. Method: **GET**
3. URL: `http://localhost:8080/api/files/health`
4. Click **Send**

**Expected Response**:
```json
{
    "status": "File upload service is running"
}
```

---

## File Restrictions

- **Allowed File Types**: PDF, JPEG/JPG
- **Max File Size**: 5 MB
- **Content Types**:
  - `application/pdf` for PDF files
  - `image/jpeg` or `image/jpg` for JPEG files

---

## Error Responses

### Invalid File Type
```json
{
    "success": false,
    "message": "File type not allowed. Only PDF and JPEG files are allowed."
}
```

### File Too Large
```json
{
    "success": false,
    "message": "File size exceeds maximum limit of 5MB"
}
```

### File Not Found
```json
{
    "success": false,
    "message": "File not found"
}
```

---

## Testing Workflow

1. **Health Check** first: `GET /api/files/health`
2. **Upload a file**: `POST /api/files/upload`
3. **Retrieve file list**: `GET /api/files/student/1`
4. **Download file**: `GET /api/files/{fileId}`
5. **Delete file**: `DELETE /api/files/{fileId}`

---

## Notes

- File data is stored as BLOB in MariaDB
- Each file is linked to a student via `studentId`
- Upload timestamp is automatically set
- All operations are logged in the application
