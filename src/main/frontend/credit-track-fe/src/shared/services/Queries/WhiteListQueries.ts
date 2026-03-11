import { useQuery } from "@tanstack/react-query";
import { IWhiteListFilterRequest } from "../../interface/IWhiteListRequest";
import WhiteListService from "../WhiteListService";

export const useGetEmailWhiteListQueries = (
  filters: IWhiteListFilterRequest,
) => {
  return useQuery({
    queryKey: ["getEmailWhiteList", filters],
    queryFn: async () => {
      const { data } = await WhiteListService.getEmailWhiteList(filters);
      return data;
    },
    staleTime: 60 * 1000 * 60, // 1 hour
  });
};
