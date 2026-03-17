import http from "./http";

export interface EvaluationStudent {
  id: number;
  firstName: string;
  lastName: string;
  fromUniversity: string;
  toProgram?: string;
  studentEmail?: string;
  year?: string;
  evaluationStatus?: string;
}

export interface EvaluationEmailRequest {
  studentIds: number[];
  recipientEmail: string;
  programHeadId?: number;
}

export interface EvaluationEmailData {
  students: EvaluationStudent[];
  recipient: string;
  sentBy?: string;
  sentDate?: string;
  attachmentCount?: number;
}

class EvaluationEmailService {
  /**
   * Get evaluation data for multiple students
   * Used to populate the email preview
   * @param studentIds Array of student IDs
   * @returns Promise with evaluation data
   */
  async getEvaluationEmailData(
    studentIds: number[],
  ): Promise<EvaluationEmailData> {
    try {
      const response = await http.post(`/evaluation-email/preview`, {
        studentIds,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching evaluation email data:", error);
      throw error;
    }
  }

  /**
   * Get individual student evaluation data
   * @param studentId Student ID
   * @returns Promise with student data
   */
  async getStudentEvaluationData(
    studentId: number,
  ): Promise<EvaluationStudent> {
    try {
      const response = await http.get(`/evaluation/student/${studentId}/data`);
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching student evaluation data for ID ${studentId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Send evaluation email to recipient
   * @param studentIds Array of student IDs to include in email
   * @param recipientEmail Email recipient
   * @param programHeadId ID of the program head sending the email
   * @returns Promise with send result
   */
  // helper to inline the template styles for clients that need to send
  // the final HTML rather than letting the server build it.  Some mail
  // providers strip out <style> blocks, so we inline everything before
  // dispatching.  This method fetches the server template, adds the
  // provided data (the backend also does this if you don't supply html),
  // and inlines the styles using `juice`.
  async sendEvaluationEmail(
    studentIds: number[],
    recipientEmail: string,
    programHeadId?: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
     
      const body: any = {
        studentIds,
        recipientEmail,
        programHeadId,
      };

      const response = await http.post(`/evaluation-email/send`, body);
      return response.data;
    } catch (error) {
      console.error("Error sending evaluation email:", error);
      throw error;
    }
  }

}

const evaluationEmailService = new EvaluationEmailService();

export default evaluationEmailService;
