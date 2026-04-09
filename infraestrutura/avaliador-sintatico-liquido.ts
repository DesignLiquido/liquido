import { AvaliadorSintaticoPituguesComImportacao } from '@designliquido/delegua-node/avaliador-sintatico/dialetos/avaliador-sintatico-pitugues-com-importacao';
import { Importador } from '@designliquido/delegua-node/importador';

export class AvaliadorSintaticoLiquidoPitugues extends AvaliadorSintaticoPituguesComImportacao {
    tiposDeFerramentasExternas: {
        [nomeFerramenta: string]: {
            [nomeTipo: string]: string;
        };
    };

    constructor(importador: Importador) {
        super(importador);
    }
}