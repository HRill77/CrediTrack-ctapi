import { ICurriculaRequest } from "../interface/ICurriculaRequest";
import { ISyllabiRequest } from "../interface/ISyllabiRequest";
import http from "./http";

class SyllabiService {
 
    getCurriculaPagination(filters: ISyllabiRequest){
        return http.post("/course/search", {
            courseName: filters.courseName,
            sortField: filters.sortField,
            sortDirection: filters.sortDirection
        },{
            params:{
                pageSize: filters.pageSize,
                page: filters.page
            }
        });
    }



    uploadSyllabi(formData: FormData) {
        return http.post("/ingest/syllabi", formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }

}

export default new SyllabiService();