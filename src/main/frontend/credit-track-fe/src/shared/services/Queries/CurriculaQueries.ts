import { useQuery } from "@tanstack/react-query";
import { ICurriculaRequest } from "../../interface/ICurriculaRequest";
import UserService from "../UserService";
import CurriculaService from "../CurriculaService";

export const useGetCurriculaserQueries = (
    filters: ICurriculaRequest
) => {
    return useQuery({
        queryKey: ["getCurriculaPagination", filters],
        queryFn: async () => {
            const { data } = await CurriculaService.getCurriculaPagination(filters);
            return data;
        },
        staleTime: 60 * 1000 * 60, // 1 hour

    });
}

export const useGetCurriculaProgramCodes = () => {
    return useQuery({
        queryKey: ["getCurriculaProgramCodes"],
        queryFn: async () => {
            const { data } = await CurriculaService.getListOfProgramCodes();
            return data;
        }
    });
}
