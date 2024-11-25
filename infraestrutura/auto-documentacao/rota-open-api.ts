import { ResponseOpenApi } from "./response-open-api";

export interface RotaOpenApi {
    tags: string[];
    summary: string;
    description: string;
    operationId: string;
    responses: {[key: string]: ResponseOpenApi};
}
