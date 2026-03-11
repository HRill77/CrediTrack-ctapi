import http from "./http";
class EmailService {
  getFilesByStudentId(studentId: number) {
    return http.get(`/files/student/${studentId}`);
  }

  /**
   * Proxy to EvaluationEmailService so all of the enhanced behaviour
   * (template fetching / inlining) lives in one place.
   */
  async sendEvaluationEmail(
    studentIds: number[],
    recipientEmail: string,
    html?: string,
  ) {
    // lazy import to avoid circular dependency in case other services
    // import EmailService.
    const EvalService = await import("./EvaluationEmailService");
    return EvalService.default.sendEvaluationEmail(
      studentIds,
      recipientEmail,
      undefined,
      html,
    );
  }
}

export default new EmailService();
