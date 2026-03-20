import { useQuery } from "@tanstack/react-query";
import { IFilterRequest } from "../../interface/IFilterRequest";
import UserService from "../UserService";

export const useGetUserQueries = (
    filters: IFilterRequest
) => {
    return useQuery({
        queryKey: ["getUsers", filters],
        queryFn: async () => {
            const { data } = await UserService.getUsers(filters);
            return data;
        },
        staleTime: 60 * 1000 * 60, // 1 hour

    });
}

export const useGetAllRoles = () => {
    return useQuery({
        queryKey: ["getAllRoles"],
        queryFn: async () => {
            const { data } = await UserService.getAllRoles();
            return data;
        },
        staleTime: 60 * 1000 * 60, // 1 hour
    });
}

export const useGetAllPrograms = () => {
    return useQuery({
        queryKey: ["getAllPrograms"],
        queryFn: async () => {
            const { data } = await UserService.getAllPrograms();
            return data;
        }
        ,
        staleTime: 60 * 1000 * 60, // 1 hour
    });
}