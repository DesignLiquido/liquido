import { Simbolo } from "@designliquido/delegua";
import { Chamada, FuncaoConstruto, Literal, Variavel } from "@designliquido/delegua/fontes/construtos";
import { Escreva } from "@designliquido/delegua/fontes/declaracoes";
import { DeleguaClasse, DeleguaFuncao } from "@designliquido/delegua/fontes/estruturas";
import { ParametroInterface } from "@designliquido/delegua/fontes/interfaces";

export class NucleoBiblioteca extends DeleguaClasse {
    constructor() {
        const metodos = {};
        metodos['rotaGet'] = new DeleguaFuncao(
            'rotaGet',
            new FuncaoConstruto(-1, -1, [
                {
                    tipo: 'padrao',
                    nome: new Simbolo('IDENTIFICADOR', "rota", null, -1, -1)
                } as ParametroInterface,
                {
                    tipo: 'padrao',
                    nome: new Simbolo('IDENTIFICADOR', "funcaoResolucao", null, -1, -1)
                } as ParametroInterface
            ], [
                new Escreva(-1, -1, [
                    new Variavel(-1, new Simbolo('IDENTIFICADOR', "rota", null, -1, -1))
                ]),
                new Chamada(-1,
                    new Variavel(-1,
                        new Simbolo('IDENTIFICADOR', "funcaoResolucao", null, -1, -1)
                    ),
                    new Simbolo('PARENTESE_DIREITO', "", null, -1, -1),
                    [
                        new Variavel(-1,
                            new Simbolo('IDENTIFICADOR', "requisicao", null, -1, -1)
                        ),
                        new Variavel(-1,
                            new Simbolo('IDENTIFICADOR', "resposta", null, -1, -1)
                        )
                    ]
                )
            ]),
            null,
            false);
        metodos['status'] = new DeleguaFuncao(
            'status',
            new FuncaoConstruto(-1, -1, [
                {
                    tipo: 'padrao',
                    nome: new Simbolo('IDENTIFICADOR', "rota", null, -1, -1)
                } as ParametroInterface,
                {
                    tipo: 'padrao',
                    nome: new Simbolo('IDENTIFICADOR', "funcaoResolucao", null, -1, -1)
                } as ParametroInterface
            ], [
                new Escreva(-1, -1, [new Literal(-1, -1, "status")])
            ]),
            null,
            false);
        super('Liquido', null, metodos);
    }
}