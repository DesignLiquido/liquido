import * as caminho from 'path';

import { Chamada, Decorador, Literal, Vetor } from '@designliquido/delegua/construtos';
import { Expressao } from '@designliquido/delegua/declaracoes';
import { ConstrutoInterface } from '@designliquido/delegua/interfaces';

import { AutoDocumentador } from '../../fontes/infraestrutura/auto-documentacao/auto-documentador';
import { MetodoHttpOpenApi } from '../../fontes/infraestrutura/auto-documentacao/metodo-http-open-api';
import { RotaOpenApi } from '../../fontes/infraestrutura/auto-documentacao/rota-open-api';
import { GeradorExpressoes } from '../../fontes/infraestrutura/utilidades/gerador-expressoes';

type ControladorDocumentado = [string, { [key in MetodoHttpOpenApi]?: RotaOpenApi }];

class AutoDocumentadorTeste extends AutoDocumentador {
    constructor(private readonly controladores: ControladorDocumentado[] = []) {
        super();
    }

    exporResolverConstrutoValorDecorador(construto: ConstrutoInterface): any {
        return this.resolverConstrutoValorDecorador(construto);
    }

    exporResolverAtributosDecorador(decorador: Decorador): Record<string, any> {
        return this.resolverAtributosDecorador(decorador);
    }

    exporResolverDecoradorDocumentacao(atributos: Record<string, any>): RotaOpenApi {
        return this.resolverDecoradorDocumentacao(atributos);
    }

    exporResolverDecoradorResposta(atributos: Record<string, any>): any {
        return this.resolverDecoradorResposta(atributos);
    }

    exporResolverDecorador(decorador: Decorador): any {
        return this.resolverDecorador(decorador);
    }

    exporLerControlador(caminhoControlador: string, declaracoes: Expressao[]) {
        return this.lerControlador(caminhoControlador, declaracoes);
    }

    protected async encontrarControladores() {
        return this.controladores;
    }
}

const literal = (valor: string) => new Literal(-1, -1, valor);

const decoradorDocumentacao = () =>
    new Decorador(-1, -1, '@rest.documentacao', {
        sumario: literal('Lista usuarios'),
        descricao: literal('Retorna usuarios cadastrados'),
        idOperacao: literal('listarUsuarios'),
        etiquetas: new Vetor(-1, -1, [literal('usuarios'), literal('admin')])
    });

describe('AutoDocumentador', () => {
    it('deve resolver valores literais e vetores usados em decoradores', () => {
        const autoDocumentador = new AutoDocumentadorTeste();
        const vetor = new Vetor(-1, -1, [literal('usuarios'), literal('admin')]);

        expect(autoDocumentador.exporResolverConstrutoValorDecorador(literal('ok'))).toBe(
            'ok'
        );
        expect(autoDocumentador.exporResolverConstrutoValorDecorador(vetor)).toEqual([
            'usuarios',
            'admin'
        ]);
    });

    it('deve traduzir atributos de documentacao para campos OpenAPI', () => {
        const autoDocumentador = new AutoDocumentadorTeste();
        const atributos = autoDocumentador.exporResolverAtributosDecorador(
            decoradorDocumentacao()
        );

        expect(autoDocumentador.exporResolverDecoradorDocumentacao(atributos)).toEqual({
            summary: 'Lista usuarios',
            description: 'Retorna usuarios cadastrados',
            operationId: 'listarUsuarios',
            tags: ['usuarios', 'admin']
        });
    });

    it('deve registrar erro quando decorador de resposta nao informa codigo', () => {
        const autoDocumentador = new AutoDocumentadorTeste();

        expect(
            autoDocumentador.exporResolverDecoradorResposta({
                descricao: 'Resposta sem status'
            })
        ).toBeNull();
        expect(autoDocumentador.erros).toHaveLength(1);
        expect(autoDocumentador.erros[0].message).toContain('@rest.resposta');
    });

    it('deve resolver decorador de resposta para o mapa de respostas OpenAPI', () => {
        const autoDocumentador = new AutoDocumentadorTeste();
        const formatos = {
            'application/json': {
                schema: {
                    type: 'object'
                }
            }
        };

        expect(
            autoDocumentador.exporResolverDecoradorResposta({
                codigo: 200,
                descricao: 'Usuarios encontrados',
                formatos
            })
        ).toEqual([
            200,
            {
                description: 'Usuarios encontrados',
                content: formatos
            }
        ]);
    });

    it('deve rejeitar decorador desconhecido de controlador', () => {
        const autoDocumentador = new AutoDocumentadorTeste();
        const decorador = new Decorador(-1, -1, '@rest.invalido', {});

        expect(autoDocumentador.exporResolverDecorador(decorador)).toBeNull();
        expect(autoDocumentador.erros).toHaveLength(1);
        expect(autoDocumentador.erros[0].message).toContain('@rest.invalido');
    });

    it('deve ler um controlador e associar decoradores ao metodo HTTP', () => {
        const autoDocumentador = new AutoDocumentadorTeste();
        const gerador = new GeradorExpressoes();
        const chamadaRota = new Chamada(
            -1,
            gerador.gerarAcessoMetodoOuPropriedade(
                gerador.gerarReferenciaVariavel('liquido'),
                'rotaGet'
            ),
            []
        );
        const decoradorResposta = new Decorador(-1, -1, '@rest.resposta', {
            codigo: literal('200'),
            descricao: literal('Usuarios encontrados')
        });
        const declaracao = new Expressao(chamadaRota, [
            decoradorDocumentacao(),
            decoradorResposta
        ]);
        const caminhoControlador =
            autoDocumentador.diretorioRotas + '/usuarios/inicial.delegua';

        expect(
            autoDocumentador.exporLerControlador(caminhoControlador, [declaracao])
        ).toEqual([
            '/usuarios/',
            {
                get: {
                    summary: 'Lista usuarios',
                    description: 'Retorna usuarios cadastrados',
                    operationId: 'listarUsuarios',
                    tags: ['usuarios', 'admin'],
                    responses: {
                        '200': {
                            description: 'Usuarios encontrados'
                        }
                    }
                }
            }
        ]);
    });

    it('deve obter estruturas de declarações de um controlador real', async () => {
        const autoDocumentador = new AutoDocumentador();
        const caminhoRota = caminho.join(process.cwd(), 'testes', 'exemplos', 'rotas', 'inicial.delegua');
        const declaracoes = await (autoDocumentador as any).obterEstruturasDeAltoNivelDeControlador(caminhoRota);
        expect(Array.isArray(declaracoes)).toBe(true);
    });

    it('deve montar o documento OpenAPI com metadados e rotas encontradas', async () => {
        const autoDocumentador = new AutoDocumentadorTeste([
            [
                '/usuarios/',
                {
                    get: {
                        summary: 'Lista usuarios'
                    }
                }
            ]
        ]);
        autoDocumentador.nomeAplicacao = 'Minha API';
        autoDocumentador.versao = '1.2.3';
        autoDocumentador.descricao = 'API de exemplo';

        await expect(autoDocumentador.documentar()).resolves.toEqual({
            openapi: '3.0.0',
            servers: [],
            info: {
                description: 'API de exemplo',
                version: '1.2.3',
                title: 'Minha API',
                license: {
                    name: 'MIT',
                    url: 'https://github.com/DesignLiquido/liquido/LICENSE'
                }
            },
            paths: {
                '/usuarios/': {
                    get: {
                        summary: 'Lista usuarios'
                    }
                }
            }
        });
    });
});
