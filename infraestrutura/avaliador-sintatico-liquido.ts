import { AvaliadorSintaticoComImportacao } from '@designliquido/delegua-node';
import { AvaliadorSintaticoPituguesComImportacao } from '@designliquido/delegua-node/avaliador-sintatico/dialetos/avaliador-sintatico-pitugues-com-importacao';
import { Importador } from '@designliquido/delegua-node/importador';

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
}