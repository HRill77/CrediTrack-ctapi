
import http from "./http";
class FileUploadService {


    getFilesByStudentId(studentId: number) {
        return http.get(`/files/student/${studentId}`);
    }

}

export default new FileUploadService();