import { Simbolo } from "@designliquido/delegua";
import { FuncaoConstruto, Variavel } from "@designliquido/delegua/fontes/construtos";
import { Escreva, Retorna } from "@designliquido/delegua/fontes/declaracoes";
import { DeleguaClasse, DeleguaFuncao } from "@designliquido/delegua/fontes/estruturas";
import { ParametroInterface } from "@designliquido/delegua/fontes/interfaces";

export class Resposta extends DeleguaClasse {
    constructor() {
        const metodos = {};
        metodos['enviar'] = new DeleguaFuncao(
            'enviar',
            new FuncaoConstruto(-1, -1, [
                {
                    tipo: 'padrao',
                    nome: new Simbolo('IDENTIFICADOR', "qualquerCoisa", null, -1, -1)
                } as ParametroInterface
            ], [
                new Escreva(-1, -1, [
                    new Variavel(-1, new Simbolo('IDENTIFICADOR', "qualquerCoisa", null, -1, -1))
                ]),
                new Retorna(
                    new Simbolo('IDENTIFICADOR', "qualquerCoisa", null, -1, -1),
                    new Variavel(-1, new Simbolo('IDENTIFICADOR', "isto", null, -1, -1))
                )
            ]),
            null,
            false);
        metodos['status'] = new DeleguaFuncao(
            'status',
            new FuncaoConstruto(-1, -1, [
                {
                    tipo: 'padrao',
                    nome: new Simbolo('IDENTIFICADOR', "qualquerCoisa", null, -1, -1)
                } as ParametroInterface
            ], [
                new Escreva(-1, -1, [
                    new Variavel(-1, new Simbolo('IDENTIFICADOR', "qualquerCoisa", null, -1, -1))
                ])
            ]),
            null,
            false);
        super('Resposta', null, metodos);
    }
}