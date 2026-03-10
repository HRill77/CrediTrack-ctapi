import { ICurriculaRequest } from "../interface/ICurriculaRequest";
import http from "./http";

class CurriculaService {
 
    getCurriculaPagination(filters: ICurriculaRequest){
        return http.post("/curricula/search", {
            programCodes: filters.programCodes,
            years: filters.years,
            semesters: filters.semesters,
            courseCodes: filters.courseCodes,
            searchText: filters.searchText,
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

    uploadCurricula(formData: FormData) {
        return http.post("/ingest/curricula", formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }

}

export default new CurriculaService();