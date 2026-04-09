import { AvaliadorSintaticoComImportacao } from '@designliquido/delegua-node';
import { AvaliadorSintaticoPituguesComImportacao } from '@designliquido/delegua-node/avaliador-sintatico/dialetos/avaliador-sintatico-pitugues-com-importacao';
import { Importador } from '@designliquido/delegua-node/importador';
import tiposDeSimbolos from '@designliquido/delegua/tipos-de-simbolos/pitugues';
import { Decorador } from '@designliquido/delegua';

function filtrarErrosFalsoPositivos(retorno: any) {
    if (!retorno.erros || retorno.erros.length === 0) return retorno;

    const mensagensIgnoradas = [
        "variável não definida: 'liquido'",
        "variável não definida: 'requisicao'",
        "variável não definida: 'resposta'",
        "esperado expressão",
        "esperado nome do parâmetro"
    ];

    retorno.erros = retorno.erros.filter((erro: any) => {
        const mensagem = (erro.message || erro.mensagem || '').toLowerCase();

        return !mensagensIgnoradas.some(msg => mensagem.includes(msg));
    });

    return retorno;
}

export class AvaliadorSintaticoDeleguaLiquido extends AvaliadorSintaticoComImportacao {
    constructor(importador: Importador) {
        super(importador);
    }

    async analisar(retornoLexador: any, hashArquivo: number): Promise<any> {
        const retorno = await super.analisar(retornoLexador, hashArquivo);

        return filtrarErrosFalsoPositivos(retorno);
    }
}

export class AvaliadorSintaticoPituguesLiquido extends AvaliadorSintaticoPituguesComImportacao {
    tiposDeFerramentasExternas: {
        [nomeFerramenta: string]: {
            [nomeTipo: string]: string;
        };
    };

    constructor(importador: Importador) {
        super(importador);
    }

    async analisar(retornoLexador: any, hashArquivo: number): Promise<any> {
        const retorno = await super.analisar(retornoLexador, hashArquivo);

        return filtrarErrosFalsoPositivos(retorno);
    }

    protected async resolverDecoradores(): Promise<void> {
        while (this.verificarTipoSimboloAtual(tiposDeSimbolos.ARROBA)) {
            this.avancarEDevolverAnterior();

            let nomeDecorador = '';
            let linha: number;
            const atributos: { [key: string]: any } = {};

            const primeiraParteNomeDecorador = this.consumir(
                tiposDeSimbolos.IDENTIFICADOR,
                'Esperado nome de decorador após "@".'
            );

            linha = Number(primeiraParteNomeDecorador.linha);
            nomeDecorador += primeiraParteNomeDecorador.lexema;

            while (this.verificarSeSimboloAtualEIgualA(tiposDeSimbolos.PONTO)) {
                const parteNomeDecorador = this.consumir(
                    tiposDeSimbolos.IDENTIFICADOR,
                    'Esperado nome de decorador após "."'
                );

                nomeDecorador += '.' + parteNomeDecorador.lexema;
            }

            if (
                this.verificarSeSimboloAtualEIgualA(tiposDeSimbolos.PARENTESE_ESQUERDO)
            ) {
                if (
                    !this.verificarTipoSimboloAtual(tiposDeSimbolos.PARENTESE_DIREITO)
                ) {
                    let indexArgumento = 0;

                    do {
                        const valorExpressao = await this.expressao();

                        atributos[indexArgumento] = valorExpressao;

                        if (indexArgumento === 0) {
                            atributos['caminho'] = valorExpressao;
                        }

                        indexArgumento++;
                    } while (this.verificarSeSimboloAtualEIgualA(tiposDeSimbolos.VIRGULA));
                }

                this.consumir(
                    tiposDeSimbolos.PARENTESE_DIREITO,
                    'Esperado ")" após argumentos do decorador.'
                );
            }

            this.pilhaDecoradores.push(
                new Decorador(
                    this.hashArquivo,
                    linha,
                    nomeDecorador,
                    atributos
                )
            );
        }
    }
}