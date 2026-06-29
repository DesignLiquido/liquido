import { Simbolo } from '@designliquido/delegua/lexador';
import { DefinirValor, FuncaoConstruto, Isto, Variavel } from '@designliquido/delegua/construtos';
import { Expressao, PropriedadeClasse, Retorna } from '@designliquido/delegua/declaracoes';
import { DeleguaFuncao, DeleguaFuncaoNativa, DescritorTipoClasse, ObjetoDeleguaClasse } from '@designliquido/delegua/interpretador/estruturas';
import { InterpretadorInterface, ParametroInterface } from '@designliquido/delegua/interfaces';
import { ReferenciaMontao } from '@designliquido/delegua/interpretador/estruturas/referencia-montao';

import { GeradorExpressoes } from './utilidades/gerador-expressoes';

/**
 * Resolve profundamente um valor do montão durante a execução do interpretador,
 * enquanto os escopos ainda estão ativos e as entradas do montão são válidas.
 *
 * Contexto: vetores e dicionários em Delégua são armazenados no montão como
 * `ReferenciaMontao`. Quando o escopo de execução de rota termina, `executarBloco`
 * chama `excluirReferencias` e remove essas entradas. Qualquer leitura posterior
 * via `resolverValor` falha com "Referência para montão não existe".
 *
 * Esta função deve ser chamada DURANTE a execução (ex: dentro de `chamar`),
 * antes do escopo ser desmontado.
 */
function resolverProfundo(visitante: InterpretadorInterface, objeto: any): any {
    if (objeto === null || objeto === undefined || typeof objeto !== 'object') return objeto;
    if (objeto instanceof ReferenciaMontao) {
        return resolverProfundo(visitante, visitante.resolverValor(objeto));
    }
    if (Array.isArray(objeto)) {
        return objeto.map(el => resolverProfundo(visitante, el));
    }
    if ('propriedades' in objeto && objeto.propriedades) {
        const resultado: { [k: string]: any } = {};
        for (const [k, v] of Object.entries(objeto.propriedades)) {
            resultado[k] = resolverProfundo(visitante, v);
        }
        return resultado;
    }
    if ('valor' in objeto && objeto.valor !== undefined) {
        return resolverProfundo(visitante, objeto.valor);
    }
    return objeto;
}

/**
 * Implementação nativa do método `json()` da classe `Resposta`.
 *
 * Não pode ser declarado como método Delégua comum (via `GeradorExpressoes`)
 * porque um método declarativo apenas copia a `ReferenciaMontao` do argumento
 * para `respostaJson`. Quando o escopo de execução de rota termina, o montão é limpo e
 * a referência se torna inválida — Liquido não consegue mais ler o valor.
 *
 * Ao sobrescrever `chamar`, temos acesso ao `visitante` (interpretador) enquanto
 * o escopo ainda está ativo. Chamamos `resolverProfundo` aqui para materializar
 * todo o grafo de `ReferenciaMontao` em valores JS simples antes da limpeza.
 */
class MetodoJson extends DeleguaFuncaoNativa {
    constructor() {
        super('json', 1, (_instancia: ObjetoDeleguaClasse | undefined, _args: any[]) => null);
        this.declaracao = new FuncaoConstruto(-1, -1, [
            {
                abrangencia: 'padrao',
                tipoDado: 'dicionário',
                nome: new Simbolo('IDENTIFICADOR', 'json', null, -1, -1)
            } as ParametroInterface
        ], []);
    }

    async chamar(visitante: InterpretadorInterface, argumentos: any[]): Promise<any> {
        const argBruto = visitante.resolverValor(argumentos[0]);
        const valorResolvido = resolverProfundo(visitante, argBruto);
        const instancia = this.instancia as ObjetoDeleguaClasse | undefined;
        if (instancia) {
            instancia.propriedades['respostaJson'] = valorResolvido;
        }
        return instancia;
    }

    funcaoPorMetodoDeClasse(instancia: ObjetoDeleguaClasse): MetodoJson {
        const copia = new MetodoJson();
        copia.instancia = instancia;
        return copia;
    }
}

/**
 * Classe de resposta exposta às funções de rota em Delégua/Pituguês.
 *
 * Cada método define propriedades na instância e retorna `isto` para encadeamento.
 * O framework lê essas propriedades em `processarPropriedadesResposta` para montar
 * a resposta HTTP final.
 *
 * Funções de rota **não precisam** usar `retorna` explicitamente. Chamar qualquer
 * método desta classe como efeito colateral é suficiente — o _framework_ recupera o
 * objeto do escopo do interpretador quando o valor de retorno da função é nulo.
 *
 * Exemplo válido em Delégua:
 * ```
 * liquido.rotaGet(funcao (requisicao, resposta) {
 *     resposta.json([{ "id": 1 }])
 * })
 * ```
 * 
 * Exemplo válido em Pituguês:
 * ```
 * funcao rotaGet(requisicao, resposta):
 *     resposta.json([{ "id": 1 }])
 * 
 * liquido.rotaGet(rotaGet)
 * ```
 *
 * Propriedades lidas pelo framework (em ordem de precedência):
 * - `destino`      → redirecionamento HTTP
 * - `lmht`         → renderização de visão LMHT
 * - `respostaJson` → resposta JSON
 * - `mensagem`     → resposta em texto puro
 * - `statusHttp`   → código de status (padrão: 200)
 */
export class Resposta extends DescritorTipoClasse {
    constructor() {
        const metodos: { [chave: string]: DeleguaFuncao } = {};
        const propriedades = [
            new PropriedadeClasse(
                new Simbolo('IDENTIFICADOR', 'destino', null, -1, -1),
                'texto'
            ),
            new PropriedadeClasse(
                new Simbolo('IDENTIFICADOR', 'respostaJson', null, -1, -1),
                'dicionário'
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
                        tipoDado: 'número',
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
        //     lmht(...visaoEValores) {
        //         se visaoEValores.tamanho() > 1 {
        //             isto.visao = visaoEValores[0]
        //             isto.valores = visaoEValores[1]
        //         } senão se visaoEValores.tamanho() == 1 {
        //             isto.valores = visaoEValores[0]
        //         }
        //         // 0 argumentos: visao resolvida automaticamente pela rota
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
                        geradorExpressoes.gerarBlocoEscopo([ // Se: 2+ args
                            geradorExpressoes.gerarAtribuicaoValorEmPropriedadeClasse(
                                'visao',
                                geradorExpressoes.gerarAcessoIndiceVariavel('visaoEValores', 0)
                            ),
                            geradorExpressoes.gerarAtribuicaoValorEmPropriedadeClasse(
                                'valores',
                                geradorExpressoes.gerarAcessoIndiceVariavel('visaoEValores', 1)
                            )
                        ]),
                        geradorExpressoes.gerarDeclaracaoSe( // Senão se: 1 arg
                            geradorExpressoes.gerarConstrutoBinario(
                                geradorExpressoes.gerarChamada(
                                    geradorExpressoes.gerarAcessoMetodoOuPropriedade(
                                        geradorExpressoes.gerarReferenciaVariavel('visaoEValores'),
                                        'tamanho'
                                    )
                                ),
                                geradorExpressoes.gerarOperadorComparacao('igual'),
                                geradorExpressoes.gerarLiteral(1)
                            ),
                            geradorExpressoes.gerarBlocoEscopo([
                                geradorExpressoes.gerarAtribuicaoValorEmPropriedadeClasse(
                                    'valores',
                                    geradorExpressoes.gerarAcessoIndiceVariavel('visaoEValores', 0)
                                )
                            ])
                            // 0 args: nenhuma atribuição; visao resolvida pela rota em logicaComumRespostaVisaoLmht
                        )
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

        // Há também esta forma de declaração, necessária quando o método precisa sobrescrever `chamar` para acessar o interpretador.
        // Ler motivos mais detalhados na documentação de `MetodoJson` deste fonte.
        metodos['json'] = new MetodoJson();
        
        super(
            new Simbolo('IDENTIFICADOR', 'Resposta', null, -1, -1), 
            undefined, 
            metodos, 
            propriedades
        );
    }
}
