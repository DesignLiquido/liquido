import { DocumentoOpenApi } from "../infraestrutura/auto-documentacao";

export interface AutoDocumentadorInterface {
    nomeAplicacao: string;
    versao: string;
    descricao: string;
    nomeLicenca: string;
    urlLicensa: string;
    documentar(): Promise<DocumentoOpenApi>;
}
