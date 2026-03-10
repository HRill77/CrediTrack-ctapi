import { StudentFormData, StudentFormDataRequest } from "../interface/StudentFormData";
import http from "./http";

class StudentService {

    saveStudentData(studentData: StudentFormDataRequest) {
        return http.post("/student/save", studentData)
    }

}

export default new StudentService();