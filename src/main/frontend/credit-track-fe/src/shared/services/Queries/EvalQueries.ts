import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { IFilterRequest } from "../../interface/IFilterRequest";
import EvaluationService from "../EvaluationService";
import TranscriptEvaluationService from "../TranscriptEvaluationService";

export const useGetEvaluationQueries = (filters: IFilterRequest) => {
  return useQuery({
    queryKey: ["getEvaluations", filters],
    queryFn: async () => {
      const { data } = await EvaluationService.getEvaluations(filters);
      return data;
    },
    staleTime: 60 * 1000 * 60,
  });
};

export const useGetEvaluationById = (id: string) => {
  return useQuery({
    queryKey: ["getEvaluationById", id],
    queryFn: async () => {
      const { data } = await EvaluationService.getEvaluationById(id);
      return data;
    },
    staleTime: 60 * 1000 * 60,
    enabled: !!id,
  });
};

export const useSearchTranscriptEvaluations = (
  filters: IFilterRequest,
  pageSize: number,
  page: number,
) => {
  return useQuery({
    queryKey: [
      "searchTranscriptEvaluations",
      filters.searchText ?? "",
      filters.sortField,
      filters.sortDirection,
      pageSize,
      page,
    ],
    queryFn: async () => {
      const response =
        await TranscriptEvaluationService.searchTranscriptEvaluations(
          filters,
          pageSize,
          page,
        );

      if (response.data?.content) {
        const transformedRows = response.data.content.map((student: any) => {
          const evaluations = student.evaluation || [];
          const latestEval =
            evaluations.length > 0
              ? evaluations.reduce((latest: any, current: any) =>
                  new Date(current.transcript.createdAt) >
                  new Date(latest.transcript.createdAt)
                    ? current
                    : latest,
                )
              : null;

          return {
            studentId: student.studentId,
            studentName:
              `${student.firstName ?? ""} ${student.middleName ?? ""} ${student.lastName ?? ""}`.trim(),
            fromUniversity: student.fromUniversity,
            fromProgram: student.fromProgram,
            toProgram: student.toProgram,
            createdAt: latestEval?.transcript?.createdAt ?? null,
            approvedDate: student.approvals?.approvedDate ?? null,
            approvals: student.approvals ?? null,
          };
        });

        return {
          rows: transformedRows,
          fullStudentsData: response.data.content,
          totalElements: response.data.totalElements || 0,
        };
      }

      return { rows: [], fullStudentsData: [], totalElements: 0 };
    },
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
