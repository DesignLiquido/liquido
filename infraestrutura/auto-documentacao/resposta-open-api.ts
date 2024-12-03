import { ConteudoRespostaOpenApi } from "./conteudo-resposta-open-api";

export interface RespostaOpenApi {
    description?: string;
    content?: {[key: string]: ConteudoRespostaOpenApi}
}