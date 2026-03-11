import { useQuery } from "@tanstack/react-query";
import { ICurriculaRequest } from "../../interface/ICurriculaRequest";
import UserService from "../UserService";
import CurriculaService from "../CurriculaService";
import CourseService from "../CourseService";
import { ICourseRequest } from "../../interface/ICourseRequest";

export const useGetCourseQueries = (
    filters: ICourseRequest
) => {
    return useQuery({
        queryKey: ["getCoursePagination", filters],
        queryFn: async () => {
            const { data } = await CourseService.getCoursesPagination(filters);
            return data;
        },
        staleTime: 60 * 1000 * 60, // 1 hour

    });
}

// export const useGetCurriculaProgramCodes = () => {
//     return useQuery({
//         queryKey: ["getCurriculaProgramCodes"],
//         queryFn: async () => {
//             const { data } = await CurriculaService.getListOfProgramCodes();
//             return data;
//         }
//     });
// }
