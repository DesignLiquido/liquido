import { InfoOpenApi } from "./info-open-api";
import { MetodoHttpOpenApi } from "./metodo-http-open-api";
import { RotaOpenApi } from "./rota-open-api";
import { ServerOpenApi } from "./server-open-api";
import { TagDocumentoOpenApi } from "./tag-documento-open-api";

export interface DocumentoOpenApi {
    openapi: '3.0.0';
    servers: ServerOpenApi[];
    info: InfoOpenApi;
    tags?: TagDocumentoOpenApi[];
    paths?: {[key: string]: {[key in MetodoHttpOpenApi]?: RotaOpenApi}}
}
