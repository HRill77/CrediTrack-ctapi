export interface EvaluationInterface {
  id: string;
  studentName: string;
  studentEmail: string;
  date: string;
  pdfUrl?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
  approvedDate?: string;
  approvals?: {
    id: number;
    approvedDate: string;
    studentId: number;
    userId: number;
  };
}