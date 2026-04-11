import { AutoDocumentadorInterface } from "../../interfaces/auto-documentador-interface";
import { ConfiguracaoComum } from "./configuracao-comum";
import { ConfiguracaoLicenca } from "./configuracao-licenca";

export class ConfiguracaoAplicacao extends ConfiguracaoComum {
    nome: string;
    versao: string;
    descricao: string;
    licenca: ConfiguracaoLicenca;

    constructor() {
        super();
        this.licenca = new ConfiguracaoLicenca();
    }

    configurar(componentes: {[key: string]: any}) {
        const autoDocumentador = componentes['autoDocumentador'] as AutoDocumentadorInterface;
        autoDocumentador.nomeAplicacao = this.nome;
        autoDocumentador.descricao = this.descricao;
        autoDocumentador.versao = this.versao;
        this.licenca.configurar(componentes);
    }
}
