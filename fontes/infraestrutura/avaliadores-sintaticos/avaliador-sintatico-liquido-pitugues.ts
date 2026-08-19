import { AvaliadorSintaticoPituguesComImportacao } from '@designliquido/delegua-node/avaliador-sintatico/dialetos/avaliador-sintatico-pitugues-com-importacao';
import { Importador } from '@designliquido/delegua-node/importador';
import { Decorador } from '@designliquido/delegua';
import { InformacaoElementoSintatico } from '@designliquido/delegua/informacao-elemento-sintatico';

import tiposDeSimbolos from '@designliquido/delegua/tipos-de-simbolos/pitugues';

export class AvaliadorSintaticoLiquidoPitugues extends AvaliadorSintaticoPituguesComImportacao {
    tiposDeFerramentasExternas: {
        [nomeFerramenta: string]: {
            [nomeTipo: string]: string;
        };
    } = {};

    constructor(importador: Importador) {
        super(importador);
    }

    // O método inicializarPilhaEscopos() do analisador Pitugues não processa
    // tiposDeFerramentasExternas (apenas a classe base não-Pitugues faz).
    // Substituímos aqui para registrar as variáveis built-in do Liquido (liquido,
    // requisicao, resposta, lincones, contexto) para que o analisador não sinalize
    // como indefinidas durante a análise dos arquivos de rota.
    protected inicializarPilhaEscopos(): void {
        super.inicializarPilhaEscopos();
        for (const tipos of Object.values(this.tiposDeFerramentasExternas)) {
            for (const [nomeTipo, tipo] of Object.entries(tipos)) {
                if (!nomeTipo || !tipo) {
                    continue;
                }
                this.pilhaEscopos.definirInformacoesVariavel(
                    nomeTipo,
                    new InformacaoElementoSintatico(nomeTipo, tipo)
                );
            }
        }
    }

    protected async resolverDecoradores(): Promise<void> {
        while (this.verificarTipoSimboloAtual(tiposDeSimbolos.ARROBA)) {
            this.avancarEDevolverAnterior();

            let nomeDecorador = '';
            const atributos: { [key: string]: any } = {};

            const primeiraParteNomeDecorador = this.consumir(
                tiposDeSimbolos.IDENTIFICADOR,
                'Esperado nome de decorador após "@".'
            );

            const linha = Number(primeiraParteNomeDecorador.linha);
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

                    // Parâmetros nomeados como `sumario = "..."` usam identificadores simples
                    // como chaves. O analisador Pitugues faz verificação de escopo em cada
                    // identificador, então suprimimos essa verificação aqui.
                    this.intuirTipoQualquerParaIdentificadores = true;

                    do {
                        const valorExpressao = await this.atribuir();

                        atributos[indexArgumento] = valorExpressao;

                        if (indexArgumento === 0) {
                            atributos['caminho'] = valorExpressao;
                        }

                        indexArgumento++;
                    } while (this.verificarSeSimboloAtualEIgualA(tiposDeSimbolos.VIRGULA));

                    this.intuirTipoQualquerParaIdentificadores = false;
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