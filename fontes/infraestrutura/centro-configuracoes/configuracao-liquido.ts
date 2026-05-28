import { ConfiguracaoAplicacao } from "./configuracao-aplicacao";
import { ConfiguracaoAutenticacao } from "./configuracao-autenticacao";
import { ConfiguracaoComum } from "./configuracao-comum";
import { ConfiguracaoDados } from "./configuracao-dados";
import { ConfiguracaoRoteador } from "./configuracao-roteador";

export class ConfiguracaoLiquido extends ConfiguracaoComum {
    arquetipo: 'rest' | 'mvc' = 'rest';

    private _linguagem: 'delegua' | 'pitugues' = 'delegua';

    get linguagem(): 'delegua' | 'pitugues' {
        return this._linguagem;
    }

    set linguagem(valor: string) {
        const normalizado = valor
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') as 'delegua' | 'pitugues';
        this._linguagem = normalizado;
    }
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
