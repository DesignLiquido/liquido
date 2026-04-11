import { GeradorExpressoes } from '../../fontes/infraestrutura/utilidades/gerador-expressoes';
import {
    AcessoIndiceVariavel,
    AcessoMetodoOuPropriedade,
    Binario,
    Chamada,
    Literal,
    Variavel
} from '@designliquido/delegua/construtos';
import { Bloco, Expressao, Retorna, Se } from '@designliquido/delegua/declaracoes';
import { FuncaoConstruto } from '@designliquido/delegua/construtos';
import { DeleguaFuncao } from '@designliquido/delegua/interpretador/estruturas';

describe('Testes do GeradorExpressoes', () => {
    let gerador: GeradorExpressoes;

    beforeEach(() => {
        gerador = new GeradorExpressoes();
    });

    it('Deve criar uma instância de GeradorExpressoes', () => {
        expect(gerador).toBeTruthy();
    });

    describe('gerarAcessoIndiceVariavel', () => {
        it('deve retornar um AcessoIndiceVariavel com índice numérico', () => {
            const resultado = gerador.gerarAcessoIndiceVariavel('minhaVariavel', 0);
            expect(resultado).toBeInstanceOf(AcessoIndiceVariavel);
        });

        it('deve retornar um AcessoIndiceVariavel com índice de string', () => {
            const resultado = gerador.gerarAcessoIndiceVariavel('minhaVariavel', 'chave');
            expect(resultado).toBeInstanceOf(AcessoIndiceVariavel);
        });
    });

    describe('gerarAcessoMetodoOuPropriedade', () => {
        it('deve retornar um AcessoMetodoOuPropriedade', () => {
            const variavel = gerador.gerarReferenciaVariavel('objeto');
            const resultado = gerador.gerarAcessoMetodoOuPropriedade(variavel, 'metodo');
            expect(resultado).toBeInstanceOf(AcessoMetodoOuPropriedade);
        });
    });

    describe('gerarBlocoEscopo', () => {
        it('deve retornar um Bloco com declarações vazias', () => {
            const resultado = gerador.gerarBlocoEscopo([]);
            expect(resultado).toBeInstanceOf(Bloco);
        });

        it('deve retornar um Bloco com declarações', () => {
            const literal = gerador.gerarLiteral(1);
            const expressao = new Expressao(literal);
            const resultado = gerador.gerarBlocoEscopo([expressao]);
            expect(resultado).toBeInstanceOf(Bloco);
        });
    });

    describe('gerarChamada', () => {
        it('deve retornar uma Chamada sem argumentos', () => {
            const variavel = gerador.gerarReferenciaVariavel('objeto');
            const acesso = gerador.gerarAcessoMetodoOuPropriedade(variavel, 'metodo');
            const resultado = gerador.gerarChamada(acesso);
            expect(resultado).toBeInstanceOf(Chamada);
        });

        it('deve retornar uma Chamada com argumentos', () => {
            const variavel = gerador.gerarReferenciaVariavel('objeto');
            const acesso = gerador.gerarAcessoMetodoOuPropriedade(variavel, 'metodo');
            const argumento = gerador.gerarLiteral(42);
            const resultado = gerador.gerarChamada(acesso, [argumento]);
            expect(resultado).toBeInstanceOf(Chamada);
        });
    });

    describe('gerarConstrutoBinario', () => {
        it('deve retornar um Binario', () => {
            const esquerdo = gerador.gerarLiteral(1);
            const operador = gerador.gerarOperadorComparacao('maior');
            const direito = gerador.gerarLiteral(0);
            const resultado = gerador.gerarConstrutoBinario(esquerdo, operador, direito);
            expect(resultado).toBeInstanceOf(Binario);
        });
    });

    describe('gerarConstrutoFuncao', () => {
        it('deve retornar um FuncaoConstruto', () => {
            const resultado = gerador.gerarConstrutoFuncao([], []);
            expect(resultado).toBeInstanceOf(FuncaoConstruto);
        });
    });

    describe('gerarDeclaracaoSe', () => {
        it('deve retornar um Se sem caminho senão', () => {
            const condicao = gerador.gerarLiteral(true);
            const entao = new Expressao(gerador.gerarLiteral(1));
            const resultado = gerador.gerarDeclaracaoSe(condicao, entao);
            expect(resultado).toBeInstanceOf(Se);
        });

        it('deve retornar um Se com caminho senão', () => {
            const condicao = gerador.gerarLiteral(true);
            const entao = new Expressao(gerador.gerarLiteral(1));
            const senao = new Expressao(gerador.gerarLiteral(2));
            const resultado = gerador.gerarDeclaracaoSe(condicao, entao, senao);
            expect(resultado).toBeInstanceOf(Se);
        });
    });

    describe('gerarLiteral', () => {
        it('deve retornar um Literal numérico', () => {
            const resultado = gerador.gerarLiteral(42);
            expect(resultado).toBeInstanceOf(Literal);
        });

        it('deve retornar um Literal de texto', () => {
            const resultado = gerador.gerarLiteral('texto');
            expect(resultado).toBeInstanceOf(Literal);
        });

        it('deve retornar um Literal booleano', () => {
            const resultado = gerador.gerarLiteral(true);
            expect(resultado).toBeInstanceOf(Literal);
        });
    });

    describe('gerarMetodo', () => {
        it('deve retornar um DeleguaFuncao', () => {
            const funcaoConstruto = gerador.gerarConstrutoFuncao([], []);
            const resultado = gerador.gerarMetodo('meuMetodo', funcaoConstruto);
            expect(resultado).toBeInstanceOf(DeleguaFuncao);
        });
    });

    describe('gerarOperadorComparacao', () => {
        it('deve retornar símbolo maior (>)', () => {
            const resultado = gerador.gerarOperadorComparacao('maior');
            expect(resultado.tipo).toBe('MAIOR');
            expect(resultado.lexema).toBe('>');
        });

        it('deve retornar símbolo menor (<)', () => {
            const resultado = gerador.gerarOperadorComparacao('menor');
            expect(resultado.tipo).toBe('MENOR');
            expect(resultado.lexema).toBe('<');
        });

        it('deve retornar símbolo maiorOuIgual (>=)', () => {
            const resultado = gerador.gerarOperadorComparacao('maiorOuIgual');
            expect(resultado.tipo).toBe('MAIOR_IGUAL');
            expect(resultado.lexema).toBe('>=');
        });

        it('deve retornar símbolo menorOuIgual (<=)', () => {
            const resultado = gerador.gerarOperadorComparacao('menorOuIgual');
            expect(resultado.tipo).toBe('MENOR_IGUAL');
            expect(resultado.lexema).toBe('<=');
        });

        it('deve retornar símbolo igual (==)', () => {
            const resultado = gerador.gerarOperadorComparacao('igual');
            expect(resultado.tipo).toBe('IGUAL_IGUAL');
            expect(resultado.lexema).toBe('==');
        });

        it('deve retornar símbolo diferente (!=)', () => {
            const resultado = gerador.gerarOperadorComparacao('diferente');
            expect(resultado.tipo).toBe('DIFERENTE');
            expect(resultado.lexema).toBe('!=');
        });
    });

    describe('gerarParametro', () => {
        it('deve retornar um parâmetro com abrangência padrão', () => {
            const resultado = gerador.gerarParametro('meuParam', 'texto');
            expect(resultado.abrangencia).toBe('padrao');
            expect(resultado.tipoDado).toBe('texto');
        });

        it('deve retornar um parâmetro com abrangência múltipla', () => {
            const resultado = gerador.gerarParametro('meuParam', 'texto', 'multiplo');
            expect(resultado.abrangencia).toBe('multiplo');
        });
    });

    describe('gerarReferenciaVariavel', () => {
        it('deve retornar uma Variavel', () => {
            const resultado = gerador.gerarReferenciaVariavel('minhaVariavel');
            expect(resultado).toBeInstanceOf(Variavel);
        });
    });

    describe('gerarAtribuicaoValorEmPropriedadeClasse', () => {
        it('deve retornar uma Expressao', () => {
            const valor = gerador.gerarLiteral(1);
            const resultado = gerador.gerarAtribuicaoValorEmPropriedadeClasse('propriedade', valor);
            expect(resultado).toBeInstanceOf(Expressao);
        });
    });

    describe('gerarRetornoDeFuncao', () => {
        it('deve retornar um Retorna', () => {
            const resultado = gerador.gerarRetornoDeFuncao('minhaVariavel');
            expect(resultado).toBeInstanceOf(Retorna);
        });
    });
});
