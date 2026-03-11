import { useQuery, useQueryClient } from "@tanstack/react-query";
import AuthService from "../AuthService";

const USER_QUERY_KEY = ["user"];

export const useUserQuery = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: async () => {
      const response = await AuthService.getUserInfo();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  const refetchUser = async () => {
    await queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
    return queryClient.refetchQueries({ queryKey: USER_QUERY_KEY });
  };

  return {
    user: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetchUser,
  };
};
