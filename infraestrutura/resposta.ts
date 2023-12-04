import { AcessoMetodo, DefinirValor, FuncaoConstruto, Isto, Literal, Variavel } from '@designliquido/delegua/fontes/construtos';
import { Escreva, Expressao, Retorna } from '@designliquido/delegua/fontes/declaracoes';
import { DeleguaClasse, DeleguaFuncao } from '@designliquido/delegua/fontes/estruturas';
import { ParametroInterface } from '@designliquido/delegua/fontes/interfaces';
import { Simbolo } from '@designliquido/delegua/fontes/lexador';
import { GeradorExpressoes } from './utilidades/gerador-expressoes';

/**
 * A classe de Resposta é usada por Delégua para instrumentação do Express.
 * Cada método dessa classe (implementado numa estrutura declarativa) direciona
 * um aspecto da resposta a ser enviada para o Express.
 */
export class Resposta extends DeleguaClasse {
    constructor() {
        const metodos = {};

        const geradorExpressoes = new GeradorExpressoes();

        metodos['definirItemNoCorpo'] = geradorExpressoes.gerarMetodo(
            'definirItemNoCorpo',
            geradorExpressoes.gerarDeclaracao([
                geradorExpressoes.gerarParametro('chave', 'texto'),
                geradorExpressoes.gerarParametro('valor', 'texto')
            ],
                [
                    new Escreva(
                        -1, -1,
                        [
                            new AcessoMetodo(
                                -1,

                                    new AcessoMetodo(-1,
                                        new AcessoMetodo(-1, new Isto(-1, -1, new Simbolo('ISTO', 'isto', null, -1, -1)), new Simbolo('IDENTIFICADOR', 'resposta', null, -1, -1)),
                                    new Simbolo('IDENTIFICADOR', 'aplicacao', null, -1, -1))
                                ,
                                new Simbolo('IDENTIFICADOR', 'params', null, -1, -1),
                            )
                        ]
                    )
            ])
        );

        metodos['itemDoCorpo'] = geradorExpressoes.gerarMetodo(
            'itemDoCorpo',
            geradorExpressoes.gerarDeclaracao(
                [geradorExpressoes.gerarParametro('chave', 'texto')],
                [

                ]
            )
        );

        /* metodos['enviar'] = geradorExpressoes.gerarMetodo(
            'enviar',
            geradorExpressoes.gerarDeclaracao(
                [geradorExpressoes.gerarParametro('mensagem', 'numero')],
                [
                    geradorExpressoes.gerarAtribuicaoValorEmPropriedadeClasse(
                        'mensagem',
                        geradorExpressoes.gerarReferenciaVariavel('mensagem')
                    ),
                    geradorExpressoes.gerarRetornoDeFuncao('isto')
                ]
            )
        );*/

        metodos['enviar'] = new DeleguaFuncao(
            'enviar',
            new FuncaoConstruto(
                -1,
                -1,
                [
                    {
                        abrangencia: 'padrao',
                        tipo: 'numero',
                        nome: new Simbolo('IDENTIFICADOR', 'mensagem', null, -1, -1)
                    } as ParametroInterface
                ],
                [
                    new Expressao(
                        new DefinirValor(
                            -1,
                            -1,
                            new Isto(-1, -1, new Simbolo('ISTO', 'isto', null, -1, -1)),
                            new Simbolo('IDENTIFICADOR', 'mensagem', null, -1, -1),
                            new Variavel(-1, new Simbolo('IDENTIFICADOR', 'mensagem', null, -1, -1))
                        )
                    ),
                    new Retorna(
                        new Simbolo('IDENTIFICADOR', 'qualquerCoisa', null, -1, -1),
                        new Variavel(-1, new Simbolo('IDENTIFICADOR', 'isto', null, -1, -1))
                    )
                ]
            ),
            null,
            false
        );
        metodos['status'] = new DeleguaFuncao(
            'status',
            new FuncaoConstruto(
                -1,
                -1,
                [
                    {
                        abrangencia: 'padrao',
                        tipo: 'numero',
                        nome: new Simbolo('IDENTIFICADOR', 'statusHttp', null, -1, -1)
                    } as ParametroInterface
                ],
                [
                    new Expressao(
                        new DefinirValor(
                            -1,
                            -1,
                            new Isto(-1, -1, new Simbolo('ISTO', 'isto', null, -1, -1)),
                            new Simbolo('IDENTIFICADOR', 'statusHttp', null, -1, -1),
                            new Variavel(-1, new Simbolo('IDENTIFICADOR', 'statusHttp', null, -1, -1))
                        )
                    ),
                    new Retorna(
                        new Simbolo('IDENTIFICADOR', 'qualquerCoisa', null, -1, -1),
                        new Variavel(-1, new Simbolo('IDENTIFICADOR', 'isto', null, -1, -1))
                    )
                ]
            ),
            null,
            false
        );
        metodos['lmht'] = new DeleguaFuncao(
            'lmht',
            new FuncaoConstruto(
                -1,
                -1,
                [
                    {
                        abrangencia: 'padrao',
                        tipo: 'numero',
                        nome: new Simbolo('IDENTIFICADOR', 'valores', null, -1, -1)
                    } as ParametroInterface
                ],
                [
                    new Expressao(
                        new DefinirValor(
                            -1,
                            -1,
                            new Isto(-1, -1, new Simbolo('ISTO', 'isto', null, -1, -1)),
                            new Simbolo('IDENTIFICADOR', 'valores', null, -1, -1),
                            new Variavel(-1, new Simbolo('IDENTIFICADOR', 'valores', null, -1, -1))
                        )
                    ),
                    new Expressao(
                        new DefinirValor(
                            -1,
                            -1,
                            new Isto(-1, -1, new Simbolo('ISTO', 'isto', null, -1, -1)),
                            new Simbolo('IDENTIFICADOR', 'lmht', null, -1, -1),
                            new Literal(-1, -1, true)
                        )
                    ),
                    new Retorna(
                        new Simbolo('IDENTIFICADOR', 'qualquerCoisa', null, -1, -1),
                        new Variavel(-1, new Simbolo('IDENTIFICADOR', 'isto', null, -1, -1))
                    )
                ]
            ),
            null,
            false
        );
        super('Resposta', null, metodos);
    }
}
