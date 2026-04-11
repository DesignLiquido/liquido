import { RespostaOpenApi } from "./resposta-open-api";

export interface RotaOpenApi {
    tags?: string[];
    summary?: string;
    description?: string;
    operationId?: string;
    responses?: {[key: string]: RespostaOpenApi};
}
