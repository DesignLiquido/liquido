import { ConfiguracaoAplicacao } from "./configuracao-aplicacao";
import { ConfiguracaoAutenticacao } from "./configuracao-autenticacao";
import { ConfiguracaoComum } from "./configuracao-comum";
import { ConfiguracaoDados } from "./configuracao-dados";
import { ConfiguracaoRoteador } from "./configuracao-roteador";

export class ConfiguracaoLiquido extends ConfiguracaoComum {
    arquetipo?: 'rest' | 'mvc';
    aplicacao: ConfiguracaoAplicacao;
    autenticacao: ConfiguracaoAutenticacao;
    dados: ConfiguracaoDados;
    roteador: ConfiguracaoRoteador;

    constructor() {
        super();
        this.aplicacao = new ConfiguracaoAplicacao();
        this.autenticacao = new ConfiguracaoAutenticacao();
        this.dados = new ConfiguracaoDados();
        this.roteador = new ConfiguracaoRoteador();
    }

    configurar(componentes: {[key: string]: any}) {
        this.aplicacao.configurar(componentes);
        this.autenticacao.configurar(componentes);
        this.dados.configurar(componentes);
        this.roteador.configurar(componentes);
    }
}
