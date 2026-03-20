import { AxiosResponse } from 'axios';
import http from "./http";

import { ITranscriptEvaluationSearchRequest } from '../interface/ITranscriptEvaluationSearchRequest';


class TranscriptEvaluationService {

    searchTranscriptEvaluations(
        request: ITranscriptEvaluationSearchRequest,
        pageSize: number = 50,
        page: number = 0
    ): Promise<AxiosResponse> {
        return http.post('/transcript-evaluation/search', request, {
            params: {
                pageSize,
                page
            }
        });
    }

    upsertEvaluations(data: any) {
    return http.post("/transcript-evaluation/upsert-evaluations", data);
}
}

export default new TranscriptEvaluationService();
