import { ConfiguracaoAplicacao } from "./configuracao-aplicacao";
import { ConfiguracaoComum } from "./configuracao-comum";
import { ConfiguracaoDados } from "./configuracao-dados";
import { ConfiguracaoRoteador } from "./configuracao-roteador";

export class ConfiguracaoLiquido extends ConfiguracaoComum {
    arquetipo?: 'rest' | 'mvc';
    aplicacao: ConfiguracaoAplicacao;
    dados: ConfiguracaoDados;
    roteador: ConfiguracaoRoteador;

    constructor() {
        super();
        this.aplicacao = new ConfiguracaoAplicacao();
        this.dados = new ConfiguracaoDados();
        this.roteador = new ConfiguracaoRoteador();
    }
}
