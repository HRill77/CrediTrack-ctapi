import { StudentFormData, StudentFormDataRequest } from "../interface/StudentFormData";
import http from "./http";

class StudentService {

    saveStudentData(studentData: StudentFormDataRequest, torFiles: File[], cdFiles: File[]) {
        const formData = new FormData();

        // Append form fields individually
        formData.append("firstname", studentData.firstname);
        formData.append("middlename", studentData.middlename);
        formData.append("lastname", studentData.lastname);
        formData.append("suffix", studentData.suffix);
        formData.append("email", studentData.email);
        formData.append("yearLevel", studentData.yearLevel);
        formData.append("fromUniversity", studentData.fromUniversity);
        formData.append("fromCollege", studentData.fromCollege);
        formData.append("fromProgram", studentData.fromProgram);
        formData.append("toUniversity", studentData.toUniversity);
        formData.append("toCollege", studentData.toCollege);
        formData.append("toProgram", studentData.toProgram);

        // Append files
        torFiles.forEach((file) => {
            formData.append("torFile", file);
        });

        cdFiles.forEach((file) => {
            formData.append("cdFile", file);
        });

        return http.post("/student/save", formData);
    }

    checkStudentEmailExists(email: string) {
        return http.get("/student/check-email", {
            params: { email }
        });
    }

}

export default new StudentService();