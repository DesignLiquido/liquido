import { DeleguaFuncao } from '@designliquido/delegua/fontes/estruturas';
import { DefinirValor, FuncaoConstruto, Isto, Construto, Variavel, Binario, Literal, Chamada, AcessoMetodoOuPropriedade, AcessoIndiceVariavel } from '@designliquido/delegua/fontes/construtos';
import { ParametroInterface, SimboloInterface } from '@designliquido/delegua/fontes/interfaces';
import { Simbolo } from '@designliquido/delegua/fontes/lexador';
import { Expressao, Retorna, Declaracao, Se, Bloco } from '@designliquido/delegua/fontes/declaracoes';

/**
 * O gerador de expressões é uma classe facilitadora para a criação de
 * objetos que normalmente são criados pelo Avaliador Sintático de
 * Delégua. 
 */
export class GeradorExpressoes {

    gerarAcessoIndiceVariavel(variavel: string, indice: number): AcessoIndiceVariavel {
        return new AcessoIndiceVariavel(
            -1, 
            new Variavel(
                -1, 
                new Simbolo('IDENTIFICADOR', variavel, null, -1, -1)
            ), 
            new Literal(-1, -1, indice), 
            new Simbolo('COLCHETE_DIREITO', ']', null, -1, -1)
        );
    }

    gerarAcessoMetodoOuPropriedade(objeto: Variavel, metodoOuPropriedade: string): AcessoMetodoOuPropriedade {
        return new AcessoMetodoOuPropriedade(
            -1, 
            objeto,
            new Simbolo('IDENTIFICADOR', metodoOuPropriedade, null, -1, -1)
        );
    }

    gerarBlocoEscopo(declaracoes: Declaracao[]): Bloco {
        return new Bloco(-1, -1, declaracoes);
    }
    
    gerarChamada(entidadeChamada: AcessoMetodoOuPropriedade, argumentos: any[] = []): Chamada {
        return new Chamada(-1, entidadeChamada, null, argumentos);
    }

    gerarConstrutoBinario(ladoEsquerdo: Construto, operador: SimboloInterface, ladoDireito: Construto) {
        return new Binario(-1, ladoEsquerdo, operador, ladoDireito);
    }

    gerarConstrutoFuncao(parametros: ParametroInterface[], corpo: Declaracao[]): FuncaoConstruto {
        return new FuncaoConstruto(-1, -1, parametros, corpo);
    }

    gerarDeclaracaoSe(condicao: Construto, caminhoEntao: Declaracao, caminhoSenao?: Declaracao) {
        return new Se(condicao, caminhoEntao, [], caminhoSenao);
    }

    gerarLiteral(valor: any) {
        return new Literal(-1, -1, valor);
    }

    gerarMetodo(nomeMetodo: string, declaracao: FuncaoConstruto): DeleguaFuncao {
        return new DeleguaFuncao(nomeMetodo, declaracao, null, false);
    }

    gerarOperadorComparacao(tipo: 'maior' | 'menor' | 'maiorOuIgual' | 'menorOuIgual' | 'igual' | 'diferente'): SimboloInterface {
        switch (tipo) {
            case 'maior':
                return new Simbolo('MAIOR', '>', null, -1, -1);
            case 'menor':
                return new Simbolo('MENOR', '<', null, -1, -1);
            case 'maiorOuIgual':
                return new Simbolo('MAIOR_IGUAL', '>=', null, -1, -1);
            case 'menorOuIgual':
                return new Simbolo('MENOR_IGUAL', '<=', null, -1, -1);
            case 'igual':
                return new Simbolo('IGUAL_IGUAL', '==', null, -1, -1);
            case 'diferente':
                return new Simbolo('DIFERENTE', '!=', null, -1, -1);
        }
    }

    gerarParametro(nome: string, tipo: string, abrangencia: 'padrao' | 'multiplo' = 'padrao'): ParametroInterface {
        return {
            abrangencia: abrangencia,
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