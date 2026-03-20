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

    updateCurricula(curricula: any) {
        return http.put("/curricula/update", curricula);
    }

    deleteCurricula(id: number) {
        return http.delete(`/curricula/delete/${id}`);
    }

    deleteMultipleCurricula(ids: number[]) {
        return http.delete("/curricula/delete-multiple", {
            data: {
                ids: ids
            }
        });
    }

  getCurriculaList(
    programTitle?: string,
    courseTitle?: string
  ) {
    const params: any = {};
    if (programTitle) {
      params.programTitle = programTitle;
    }
    if (courseTitle) {
      params.courseTitle = courseTitle;
    }
    return http.get("/curricula/list/by-program-and-course-title", { params });
  }

}

export default new CurriculaService();