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
    html?: string, // optional HTML payload from frontend
  ): Promise<{ success: boolean; message: string }> {
    try {
      // `html` parameter may already contain markup passed from caller; we'll
      // override it if we fetch and inline a template locally.  use a distinct
      // name to avoid shadowing warnings.
      let inlinedHtml: string | undefined = html;
      try {
        console.log("Fetching email template...");
        const templateResponse = await this.getEmailTemplate();
        console.log("Template response:", templateResponse);

        const { template, styles } = templateResponse;

        if (!template || !styles) {
          console.warn("Template or styles are empty", {
            hasTemplate: !!template,
            hasStyles: !!styles,
          });
          throw new Error("Template or styles missing from server response");
        }

        const raw = `<style>${styles}</style>${template}`;
        console.log(
          "Raw HTML before inlining (first 500 chars):",
          raw.substring(0, 500),
        );

        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const juice = require("juice");
          inlinedHtml = juice(raw);
          console.log(
            "✓ Inlined HTML generated (" +
              (inlinedHtml?.length ?? 0) +
              " bytes)",
          );
        } catch (juiceErr) {
          console.error("Juice inlining failed:", juiceErr);
          inlinedHtml = raw;
          console.log("Falling back to raw HTML without inlining");
        }
      } catch (innerErr) {
        console.error("ERROR: Failed to build HTML:", innerErr);
      }

      const body: any = {
        studentIds,
        recipientEmail,
        programHeadId,
      };

      if (inlinedHtml) {
        console.log("✓ Sending WITH HTML (" + inlinedHtml.length + " bytes)");
        body.html = inlinedHtml;
      } else {
        console.warn(
          "✗ Sending WITHOUT HTML - backend will use its own template",
        );
      }

      const response = await http.post(`/evaluation-email/send`, body);
      return response.data;
    } catch (error) {
      console.error("Error sending evaluation email:", error);
      throw error;
    }
  }

  // ...existing code...

  /**
   * Generate and download evaluation email as HTML/PDF
   * @param studentIds Array of student IDs
   * @returns Promise with file download
   */
  async generateEvaluationEmailPDF(studentIds: number[]): Promise<Blob> {
    try {
      const response = await http.post(
        `/evaluation-email/generate-pdf`,
        { studentIds },
        { responseType: "blob" },
      );
      return response.data;
    } catch (error) {
      console.error("Error generating evaluation email PDF:", error);
      throw error;
    }
  }

  /**
   * Get email template
   * @returns Promise with email template HTML
   */
  async getEmailTemplate(): Promise<{ template: string; styles: string }> {
    try {
      const response = await http.get(`/evaluation-email/template`);
      return response.data;
    } catch (error) {
      console.error("Error fetching email template:", error);
      throw error;
    }
  }

  /**
   * Resend email to failed recipients
   * @param emailId ID of the original evaluation email
   * @returns Promise with resend result
   */
  async resendEvaluationEmail(
    emailId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await http.post(`/evaluation-email/${emailId}/resend`);
      return response.data;
    } catch (error) {
      console.error("Error resending evaluation email:", error);
      throw error;
    }
  }

  /**
   * Get evaluation email history
   * @param programHeadId ID of program head
   * @returns Promise with email history
   */
  async getEvaluationEmailHistory(programHeadId: number): Promise<any[]> {
    try {
      const response = await http.get(
        `/evaluation-email/history/${programHeadId}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching evaluation email history:", error);
      throw error;
    }
  }
}

const evaluationEmailService = new EvaluationEmailService();

export default evaluationEmailService;
