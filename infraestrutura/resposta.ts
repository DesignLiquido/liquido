import { Simbolo } from "@designliquido/delegua";
import { DefinirValor, FuncaoConstruto, Isto, Literal, Variavel } from "@designliquido/delegua/fontes/construtos";
import { Expressao, Retorna } from "@designliquido/delegua/fontes/declaracoes";
import { DeleguaClasse, DeleguaFuncao } from "@designliquido/delegua/fontes/estruturas";
import { ParametroInterface } from "@designliquido/delegua/fontes/interfaces";

/** 
 * A classe de Resposta é usada por Delégua para instrumentação do Express.
 * Cada método dessa classe (implementado numa estrutura declarativa) direciona 
 * um aspecto da resposta a ser enviada para o Express.
 */
export class Resposta extends DeleguaClasse {
    constructor() {
        const metodos = {};
        metodos['enviar'] = new DeleguaFuncao(
            'enviar',
            new FuncaoConstruto(-1, -1, [
                {
                    tipo: 'padrao',
                    nome: new Simbolo('IDENTIFICADOR', "mensagem", null, -1, -1)
                } as ParametroInterface
            ], [
                new Expressao(new DefinirValor(
                    -1,
                    -1,
                    new Isto(-1, -1, new Simbolo('ISTO', 'isto', null, -1, -1)),
                    new Simbolo('IDENTIFICADOR', 'mensagem', null, -1, -1),
                    new Variavel(-1, new Simbolo('IDENTIFICADOR', "mensagem", null, -1, -1))
                )),
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
                    nome: new Simbolo('IDENTIFICADOR', "statusHttp", null, -1, -1)
                } as ParametroInterface
            ], [
                new Expressao(new DefinirValor(
                    -1,
                    -1,
                    new Isto(-1, -1, new Simbolo('ISTO', 'isto', null, -1, -1)),
                    new Simbolo('IDENTIFICADOR', 'statusHttp', null, -1, -1),
                    new Variavel(-1, new Simbolo('IDENTIFICADOR', "statusHttp", null, -1, -1))
                )),
                new Retorna(
                    new Simbolo('IDENTIFICADOR', "qualquerCoisa", null, -1, -1),
                    new Variavel(-1, new Simbolo('IDENTIFICADOR', "isto", null, -1, -1))
                )
            ]),
            null,
            false);
        metodos['lmht'] = new DeleguaFuncao(
                'lmht',
                new FuncaoConstruto(-1, -1, [
                    {
                        tipo: 'padrao',
                        nome: new Simbolo('IDENTIFICADOR', "valores", null, -1, -1)
                    } as ParametroInterface
                ], [
                    new Expressao(new DefinirValor(
                        -1,
                        -1,
                        new Isto(-1, -1, new Simbolo('ISTO', 'isto', null, -1, -1)),
                        new Simbolo('IDENTIFICADOR', 'valores', null, -1, -1),
                        new Variavel(-1, new Simbolo('IDENTIFICADOR', "valores", null, -1, -1))
                    )),
                    new Expressao(new DefinirValor(
                        -1,
                        -1,
                        new Isto(-1, -1, new Simbolo('ISTO', 'isto', null, -1, -1)),
                        new Simbolo('IDENTIFICADOR', 'lmht', null, -1, -1),
                        new Literal(-1, -1, true)
                    )),
                    new Retorna(
                        new Simbolo('IDENTIFICADOR', "qualquerCoisa", null, -1, -1),
                        new Variavel(-1, new Simbolo('IDENTIFICADOR', "isto", null, -1, -1))
                    )
                ]),
                null,
                false);
        super('Resposta', null, metodos);
    }
}