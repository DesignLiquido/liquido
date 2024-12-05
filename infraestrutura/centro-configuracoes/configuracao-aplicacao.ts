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
}
