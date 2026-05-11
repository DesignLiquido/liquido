import { AvaliadorSintaticoComImportacao } from "@designliquido/delegua-node/avaliador-sintatico";
import { Importador } from "@designliquido/delegua-node/importador";

export class AvaliadorSintaticoLiquido extends AvaliadorSintaticoComImportacao {
    constructor(importador: Importador) {
        super(importador);
    }
}
