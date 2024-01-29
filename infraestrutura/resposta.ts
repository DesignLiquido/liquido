import { Simbolo } from '@designliquido/delegua/fontes/lexador';
import { DefinirValor, FuncaoConstruto, Isto, Variavel } from '@designliquido/delegua/fontes/construtos';
import { Expressao, PropriedadeClasse, Retorna } from '@designliquido/delegua/fontes/declaracoes';
import { DeleguaClasse, DeleguaFuncao } from '@designliquido/delegua/fontes/estruturas';
import { ParametroInterface } from '@designliquido/delegua/fontes/interfaces';

import { GeradorExpressoes } from './utilidades/gerador-expressoes';

/**
 * A classe de Resposta é usada por Delégua para instrumentação do Express.
 * Cada método dessa classe (implementado numa estrutura declarativa) direciona
 * um aspecto da resposta a ser enviada para o Express.
 */
export class Resposta extends DeleguaClasse {
    constructor() {
        const metodos = {};
        const propriedades = [
            new PropriedadeClasse(
                new Simbolo('IDENTIFICADOR', 'destino', null, -1, -1),
                'texto'
            ),
            new PropriedadeClasse(
                new Simbolo('IDENTIFICADOR', 'mensagem', null, -1, -1),
                'texto'
            ),
            new PropriedadeClasse(
                new Simbolo('IDENTIFICADOR', 'statusHttp', null, -1, -1),
                'numero'
            ),
            new PropriedadeClasse(
                new Simbolo('IDENTIFICADOR', 'valores', null, -1, -1),
                'dicionário'
            ),
            new PropriedadeClasse(
                new Simbolo('IDENTIFICADOR', 'visao', null, -1, -1),
                'texto'
            )
        ];

        // Há duas formas de construção de métodos apenas usando
        // estruturas de alto nível: declarando cada uma manualmente, 
        // ou usando o gerador de expressões.
        // O exemplo abaixo utiliza o gerador de expressões.
        // Seria o equivalente à seguinte implementação em Delégua:

        // classe Resposta {
        //     // Outros método e propriedades aqui
        //     enviar(mensagem: texto) {
        //         isto.mensagem = mensagem
        //         retorna isto
        //     }
        // }

        const geradorExpressoes = new GeradorExpressoes();
        metodos['enviar'] = geradorExpressoes.gerarMetodo('enviar', 
            geradorExpressoes.gerarConstrutoFuncao(
                [geradorExpressoes.gerarParametro('mensagem', 'texto')],
                [
                    geradorExpressoes.gerarAtribuicaoValorEmPropriedadeClasse(
                        'mensagem', 
                        geradorExpressoes.gerarReferenciaVariavel('mensagem')
                    ),
                    geradorExpressoes.gerarRetornoDeFuncao('isto')
                ]
            )
        );

        // O exemplo abaixo gera um método `status` declarando manualmente
        // todas as estruturas de alto nível de Delégua.
        // Seria o equivalente à seguinte implementação:

        // classe Resposta {
        //     // Outros método e propriedades aqui
        //     status(statusHttp: numero) {
        //         isto.statusHttp = statusHttp
        //         retorna isto
        //     }
        // }
        
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

        // O exemplo abaixo gera um método `lmht` utilizando o gerador de expressões.
        // Seria o equivalente à seguinte implementação:

        // classe Resposta {
        //     visao: texto
        //     valores: dicionário
        // 
        //     lmht(*visaoEValores) {
        //         se visaoEValores.tamanho() > 1 {
        //             isto.visao = visaoEValores[0]
        //             isto.valores = visaoEValores[1]
        //         } senão {
        //             isto.valores = visaoEValores[0]
        //         }
        // 
        //         retorna isto
        //     }
        // }

        metodos['lmht'] = geradorExpressoes.gerarMetodo('lmht', 
            geradorExpressoes.gerarConstrutoFuncao(
                [geradorExpressoes.gerarParametro('visaoEValores', 'vetor', 'multiplo')],
                [
                    geradorExpressoes.gerarAtribuicaoValorEmPropriedadeClasse(
                        'lmht', 
                        geradorExpressoes.gerarLiteral(true)
                    ),
                    geradorExpressoes.gerarDeclaracaoSe(
                        geradorExpressoes.gerarConstrutoBinario(
                            geradorExpressoes.gerarChamada(
                                geradorExpressoes.gerarAcessoMetodoOuPropriedade(
                                    geradorExpressoes.gerarReferenciaVariavel('visaoEValores'),
                                    'tamanho'
                                )
                            ),
                            geradorExpressoes.gerarOperadorComparacao('maior'),
                            geradorExpressoes.gerarLiteral(1)
                        ), 
                        geradorExpressoes.gerarBlocoEscopo([ // Se
                            geradorExpressoes.gerarAtribuicaoValorEmPropriedadeClasse(
                                'visao', 
                                geradorExpressoes.gerarAcessoIndiceVariavel('visaoEValores', 0)
                            ),
                            geradorExpressoes.gerarAtribuicaoValorEmPropriedadeClasse(
                                'valores', 
                                geradorExpressoes.gerarAcessoIndiceVariavel('visaoEValores', 1)
                            )
                        ]),
                        geradorExpressoes.gerarBlocoEscopo([ // Senão
                            geradorExpressoes.gerarAtribuicaoValorEmPropriedadeClasse(
                                'valores', 
                                geradorExpressoes.gerarAcessoIndiceVariavel('visaoEValores', 0)
                            ),
                        ])
                    ),
                    geradorExpressoes.gerarRetornoDeFuncao('isto')
                ])
            );

        metodos['redirecionar'] = geradorExpressoes.gerarMetodo('redirecionar', 
            geradorExpressoes.gerarConstrutoFuncao(
                [geradorExpressoes.gerarParametro('destino', 'texto')],
                [
                    geradorExpressoes.gerarAtribuicaoValorEmPropriedadeClasse(
                        'destino', 
                        geradorExpressoes.gerarReferenciaVariavel('destino')
                    ),
                    geradorExpressoes.gerarRetornoDeFuncao('isto')
                ]
            )
        );
        
        super(
            new Simbolo('IDENTIFICADOR', 'Resposta', null, -1, -1), 
            null, 
            metodos, 
            propriedades
        );
    }
}
