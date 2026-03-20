export interface ITranscriptRequest {
    studentId: number;
    transcripts: {
        year: String;
        subjectCode: string;
        courseName: string;
        grade: number;
        credits: number;
    }[];
}