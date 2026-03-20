import { AxiosResponse } from 'axios';
import http from "./http";
import { TranscriptDto } from '../interface/TranscriptDto';
import { ITranscriptRequest } from '../interface/ITranscriptRequest';


class TranscriptService {

    uploadTranscript(files: File | File[]): Promise<AxiosResponse<TranscriptDto[]>> {
        const formData = new FormData();
        
        // Handle both single and multiple files
        if (Array.isArray(files)) {
            files.forEach(file => {
                formData.append('file', file);
            });
        } else {
            formData.append('file', files);
        }
        
       

        return http.post<TranscriptDto[]>("/transcripts/upload2", formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }

      evaluateTranscript(
        data: ITranscriptRequest | ITranscriptRequest[],
        program: string
    ): Promise<AxiosResponse<any>> {

        return http.post(
            `/transcripts/evaluate?program=${encodeURIComponent(program)}`,
            data
        );
    }
}

export default new TranscriptService();
