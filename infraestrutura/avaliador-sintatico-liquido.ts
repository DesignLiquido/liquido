import { AvaliadorSintaticoComImportacao } from '@designliquido/delegua-node';
import { AvaliadorSintaticoPituguesComImportacao } from '@designliquido/delegua-node/avaliador-sintatico/dialetos/avaliador-sintatico-pitugues-com-importacao';
import { Importador } from '@designliquido/delegua-node/importador';
import tiposDeSimbolos from '@designliquido/delegua/tipos-de-simbolos/pitugues';
import { Decorador } from '@designliquido/delegua';

export class AvaliadorSintaticoDeleguaLiquido extends AvaliadorSintaticoComImportacao {
    constructor(importador: Importador) {
        super(importador);
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