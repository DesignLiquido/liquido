import { DeleguaFuncao } from '@designliquido/delegua/fontes/estruturas';
import { DefinirValor, FuncaoConstruto, Isto, Construto, Variavel } from '@designliquido/delegua/fontes/construtos';
import { ParametroInterface } from '@designliquido/delegua/fontes/interfaces';
import { Simbolo } from '@designliquido/delegua/fontes/lexador';
import { Expressao, Retorna, Declaracao } from '@designliquido/delegua/fontes/declaracoes';

/**
 * O gerador de expressões é uma classe facilitadora para a criação de
 * objetos que normalmente são criados pelo Avaliador Sintático de
 * Delégua. 
 */
export class GeradorExpressoes {

    gerarMetodo(nomeMetodo: string, declaracao: FuncaoConstruto): DeleguaFuncao {
        return new DeleguaFuncao(nomeMetodo, declaracao, null, false);
    }

    gerarDeclaracao(parametros: ParametroInterface[], corpo: Declaracao[]): FuncaoConstruto {
        return new FuncaoConstruto(-1, -1, parametros, corpo);
    }

    gerarParametro(nome: string, tipo: string): ParametroInterface {
        return {
            abrangencia: 'padrao',
            tipo: tipo,
            nome: new Simbolo('IDENTIFICADOR', nome, null, -1, -1)
        } as ParametroInterface;
    }

    gerarReferenciaVariavel(nomeVariavel: string) {
        return new Variavel(-1, new Simbolo('IDENTIFICADOR', nomeVariavel, null, -1, -1))
    }

    /**
     * Gera uma atribuição de valor em uma propriedade de classe. 
     * Por exemplo, `isto.a = 1` seria algo como 
     * `gerarAtribuicaoValorEmPropriedadeClasse('a', 1)`.
     */
    gerarAtribuicaoValorEmPropriedadeClasse(nomePropriedade: string, valor: Construto): Expressao {
        return new Expressao(
            new DefinirValor(
                -1,
                -1,
                new Isto(-1, -1, new Simbolo('ISTO', 'isto', null, -1, -1)),
                new Simbolo('IDENTIFICADOR', nomePropriedade, null, -1, -1),
                valor
            )
        );
    }

    gerarRetornoDeFuncao(nomeVariavel: string): Retorna {
        return new Retorna(
            new Simbolo('IDENTIFICADOR', 'qualquerCoisa', null, -1, -1),
            new Variavel(-1, new Simbolo('IDENTIFICADOR', nomeVariavel, null, -1, -1))
        ) 
    }
}