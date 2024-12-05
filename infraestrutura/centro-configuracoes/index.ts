import { AcessoMetodoOuPropriedade, DefinirValor } from "@designliquido/delegua/construtos";
import { Declaracao, Expressao } from "@designliquido/delegua/declaracoes";
import { VariavelInterface } from "@designliquido/delegua/interfaces";
import { ConfiguracaoLiquido } from "./configuracao-liquido";
import { AspectoConfiguracaoInterface } from "./aspecto-configuracao-interface";

export class CentroConfiguracoes {
    liquido: ConfiguracaoLiquido;

    constructor(declaracoes: Declaracao[]) {
        this.liquido = new ConfiguracaoLiquido();

        const entradasConfiguracao: any[] = [];
        for (const declaracao of declaracoes) {
            if (declaracao.constructor.name === 'Comentario') {
                continue;
            }

            const expressao: DefinirValor = (declaracao as Expressao).expressao as DefinirValor;
            const entradaConfiguracao = this.desdobrarConfiguracao(expressao);
            entradasConfiguracao.push(entradaConfiguracao);
        }

        // console.log(entradasConfiguracao);
        for (const entradaConfiguracao of entradasConfiguracao) {
            const caminhoConfiguracao = entradaConfiguracao[0];
            const valorConfiguracao = entradaConfiguracao[1];
            (this[caminhoConfiguracao[0]] as AspectoConfiguracaoInterface)
                .definirValor(this[caminhoConfiguracao[0]], caminhoConfiguracao, valorConfiguracao);
        }

        console.log(this);
    }

    protected desdobrarConfiguracao(expressaoDefinirValor: DefinirValor) {
        const objetoAlvo: AcessoMetodoOuPropriedade = expressaoDefinirValor.objeto as AcessoMetodoOuPropriedade;
        const nomePropriedade: string = expressaoDefinirValor.nome.lexema;
        const informacoesVariavel: VariavelInterface = expressaoDefinirValor.valor;

        let partesNomePropriedade = [objetoAlvo.simbolo.lexema, nomePropriedade];
        if (objetoAlvo.objeto) {
            partesNomePropriedade = [
                ...this.desdobrarNomePropriedade(objetoAlvo.objeto as AcessoMetodoOuPropriedade),
                ...partesNomePropriedade
            ]
        }

        return [partesNomePropriedade, informacoesVariavel.valor];
    }

    protected desdobrarNomePropriedade(objetoExterno: AcessoMetodoOuPropriedade) {
        if (!objetoExterno.objeto) {
            return [objetoExterno.simbolo.lexema];
        }

        return [
            ...this.desdobrarNomePropriedade(objetoExterno.objeto as AcessoMetodoOuPropriedade),
            objetoExterno.simbolo.lexema
        ];
    }
}
