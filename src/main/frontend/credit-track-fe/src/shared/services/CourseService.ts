import { ICourseRequest } from "../interface/ICourseRequest";
import { ICurriculaRequest } from "../interface/ICurriculaRequest";
import http from "./http";

class CourseService {
 
    getCoursesPagination(filters: ICourseRequest){
        return http.post("/courses/search", {
            courseName: filters.searchText,
            sortField: filters.sortField,
            sortDirection: filters.sortDirection
        },{
            params:{
                pageSize: filters.pageSize,
                page: filters.page
            }
        });
    }

    getListOfProgramCodes() {
        return http.get("/curricula/filters/program-codes");
    }

    uploadCourses(formData: FormData) {
        return http.post("/ingest/courses", formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }

    deleteCourse(id: number) {
        return http.delete(`/courses/delete/${id}`);
    }

    deleteMultipleCourses(ids: number[]) {
        return http.delete("/courses/delete-multiple", {
            data: {
                ids: ids
            }
        });
    }

}

export default new CourseService();