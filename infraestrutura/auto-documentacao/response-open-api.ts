import { ResponseContentOpenApi } from "./response-content-open-api";

export interface ResponseOpenApi {
    description: string;
    content?: {[key: string]: ResponseContentOpenApi}
}