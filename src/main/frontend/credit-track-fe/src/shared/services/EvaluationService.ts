import { IFilterRequest } from "../interface/IFilterRequest";
import { EvaluationInterface } from "../interface/EvaluationInterface";
import http from "./http";

// Mock data for development
const MOCK_EVALUATIONS: EvaluationInterface[] = [
  {
    id: "1",
    studentName: "De Leon, Hannah Lorraine M.",
    studentEmail: "hannah.deleon@example.com",
    date: "2025-08-21T00:00:00Z",
    pdfUrl: "/pdfs/evaluation-1.pdf",
    status: "completed",
    createdAt: "2025-08-21T10:30:00Z",
    updatedAt: "2025-08-21T10:30:00Z",
  },
  {
    id: "2",
    studentName: "Malnao, Joyce Anne",
    studentEmail: "joyce.malnao@example.com",
    date: "2025-08-21T00:00:00Z",
    pdfUrl: "/pdfs/evaluation-2.pdf",
    status: "completed",
    createdAt: "2025-08-21T11:15:00Z",
    updatedAt: "2025-08-21T11:15:00Z",
  },
  {
    id: "3",
    studentName: "Vidal, Jelyn",
    studentEmail: "jelyn.vidal@example.com",
    date: "2025-08-21T00:00:00Z",
    pdfUrl: "/pdfs/evaluation-3.pdf",
    status: "completed",
    createdAt: "2025-08-21T14:20:00Z",
    updatedAt: "2025-08-21T14:20:00Z",
  },
  {
    id: "4",
    studentName: "Carlos, Mary Lovensky",
    studentEmail: "mary.carlos@example.com",
    date: "2025-07-21T00:00:00Z",
    pdfUrl: "/pdfs/evaluation-4.pdf",
    status: "completed",
    createdAt: "2025-07-21T09:45:00Z",
    updatedAt: "2025-07-21T09:45:00Z",
  },
];

// Helper function to simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to filter and paginate mock data
const filterMockData = (filters: IFilterRequest) => {
  let filtered = [...MOCK_EVALUATIONS];

  // Apply search filter
  if (filters.searchText) {
    const searchLower = filters.searchText.toLowerCase();
    filtered = filtered.filter(
      (evaluation) =>
        evaluation.studentName.toLowerCase().includes(searchLower) ||
        evaluation.studentEmail.toLowerCase().includes(searchLower)
    );
  }

  // Apply sorting
  if (filters.sortField && filters.sortField.length > 0) {
    filtered.sort((a, b) => {
      const field = filters.sortField[0] as keyof EvaluationInterface;
      const direction = filters.sortDirection[0] === "desc" ? -1 : 1;

      const aValue = a[field];
      const bValue = b[field];

      // Handle undefined values
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1 * direction;
      if (bValue === undefined) return -1 * direction;

      // Handle null values
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1 * direction;
      if (bValue === null) return -1 * direction;

      // Compare values
      if (aValue < bValue) return -1 * direction;
      if (aValue > bValue) return 1 * direction;
      return 0;
    });
  }

  // Calculate pagination
  const totalElements = filtered.length;
  const page = filters.page || 0;
  const pageSize = filters.pageSize || 10;
  const start = page * pageSize;
  const end = start + pageSize;
  const content = filtered.slice(start, end);

  return {
    content,
    totalElements,
    totalPages: Math.ceil(totalElements / pageSize),
    size: pageSize,
    number: page,
  };
};

class EvaluationService {
  // Toggle this to switch between mock and real API
  private USE_MOCK = true;

  async getEvaluations(filters: IFilterRequest) {
    if (this.USE_MOCK) {
      // Simulate API delay
      await delay(500);
      return {
        data: filterMockData(filters),
      };
    }

    // Real API call (uncomment when ready)
    return http.post(
      "/evaluations/search",
      {
        searchText: filters.searchText,
        sortField: filters.sortField,
        sortDirection: filters.sortDirection,
      },
      {
        params: {
          pageSize: filters.pageSize,
          page: filters.page,
        },
      }
    );
  }

  async getEvaluationById(id: string) {
    if (this.USE_MOCK) {
      await delay(300);
      const evaluation = MOCK_EVALUATIONS.find((e) => e.id === id);
      return {
        data: evaluation || null,
      };
    }

    // Real API call
    return http.get(`/evaluations/${id}`);
  }

  async downloadPDF(id: string) {
    if (this.USE_MOCK) {
      await delay(500);
      // Create a mock PDF blob
      const mockPdfContent = `Mock PDF for Evaluation ${id}`;
      const blob = new Blob([mockPdfContent], { type: "application/pdf" });
      return {
        data: blob,
      };
    }

    // Real API call
    return http.get(`/evaluations/${id}/pdf`, {
      responseType: "blob",
    });
  }

  async resendEmail(id: string) {
    if (this.USE_MOCK) {
      await delay(800);
      return {
        data: {
          success: true,
          message: "Email resent successfully",
        },
      };
    }

    // Real API call
    return http.post(`/evaluations/${id}/resend-email`);
  }

  async createEvaluation(data: any) {
    if (this.USE_MOCK) {
      await delay(1000);
      const newEvaluation: EvaluationInterface = {
        id: String(MOCK_EVALUATIONS.length + 1),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      MOCK_EVALUATIONS.unshift(newEvaluation);
      return {
        data: newEvaluation,
      };
    }

    // Real API call
    return http.post("/evaluations", data);
  }

  async updateEvaluation(id: string, data: any) {
    if (this.USE_MOCK) {
      await delay(800);
      const index = MOCK_EVALUATIONS.findIndex((e) => e.id === id);
      if (index !== -1) {
        MOCK_EVALUATIONS[index] = {
          ...MOCK_EVALUATIONS[index],
          ...data,
          updatedAt: new Date().toISOString(),
        };
        return {
          data: MOCK_EVALUATIONS[index],
        };
      }
      throw new Error("Evaluation not found");
    }

    // Real API call
    return http.put(`/evaluations/${id}`, data);
  }

  async deleteEvaluation(id: string) {
    if (this.USE_MOCK) {
      await delay(600);
      const index = MOCK_EVALUATIONS.findIndex((e) => e.id === id);
      if (index !== -1) {
        MOCK_EVALUATIONS.splice(index, 1);
        return {
          data: {
            success: true,
            message: "Evaluation deleted successfully",
          },
        };
      }
      throw new Error("Evaluation not found");
    }

    // Real API call
    return http.delete(`/evaluations/${id}`);
  }

  // Method to toggle between mock and real API
  setUseMock(useMock: boolean) {
    this.USE_MOCK = useMock;
  }
}

export default new EvaluationService();