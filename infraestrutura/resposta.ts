import { DeleguaClasse, DeleguaFuncao } from "@designliquido/delegua/fontes/estruturas";

export class Resposta extends DeleguaClasse {
    constructor() {
        const metodos = {};
        metodos['enviar'] = new DeleguaFuncao('enviar', null, null, false);
        metodos['status'] = new DeleguaFuncao('status', null, null, false);
        super('Resposta', null, metodos);
    }
}