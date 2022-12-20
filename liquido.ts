import * as caminho from 'path';
import * as sistemaDeArquivos from 'node:fs';

import {
    AvaliadorSintatico,
    Importador,
    Interpretador,
    Lexador,
    RetornoInterpretador,
    Simbolo
} from '@designliquido/delegua';
import {
    AcessoMetodo,
    Chamada,
    Construto,
    DefinirValor,
    FuncaoConstruto,
    Variavel
} from '@designliquido/delegua/fontes/construtos';
import { Expressao } from '@designliquido/delegua/fontes/declaracoes';
import { DeleguaFuncao } from '@designliquido/delegua/fontes/estruturas';
import { VariavelInterface } from '@designliquido/delegua/fontes/interfaces';

import { Resposta } from './infraestrutura';
import { Roteador } from './infraestrutura/roteador';
import { LiquidoInterface, RetornoMiddleware } from './interfaces';
import { FormatadorLmht } from './infraestrutura/formatadores';
import { ProvedorLincones } from './infraestrutura/provedores';

/**
 * O núcleo do framework.
 */
export class Liquido implements LiquidoInterface {
    importador: Importador;
    interpretador: Interpretador;
    roteador: Roteador;
    formatadorLmht: FormatadorLmht;
    provedorLincones: ProvedorLincones;

    arquivosDelegua: string[];
    rotasDelegua: string[];
    diretorioBase: string;
    diretorioDescobertos: string[];

    arquivosAbertos: { [identificador: string]: string };
    conteudoArquivosAbertos: { [identificador: string]: string[] };

    constructor(diretorioBase: string) {
        this.arquivosAbertos = {};
        this.conteudoArquivosAbertos = {};
        this.arquivosDelegua = [];
        this.rotasDelegua = [];
        this.diretorioDescobertos = [];
        this.diretorioBase = diretorioBase;

        this.importador = new Importador(
            new Lexador(),
            new AvaliadorSintatico(),
            this.arquivosAbertos,
            this.conteudoArquivosAbertos,
            false
        );

        this.formatadorLmht = new FormatadorLmht(this.diretorioBase);
        this.interpretador = new Interpretador(this.importador, process.cwd(), false, console.log);
        this.roteador = new Roteador();
        this.provedorLincones = new ProvedorLincones();
    }

    async iniciar(): Promise<void> {
        this.importarArquivoConfiguracao();
        this.roteador.iniciarMiddlewares();
        this.importarArquivosRotas();

        this.roteador.iniciar();
        if (this.provedorLincones.configurado) {
            this.interpretador.pilhaEscoposExecucao
                .definirVariavel('lincones', this.provedorLincones.resolver());
        }
    }

    /**
     * Método de importação do arquivo `configuracao.delegua`.
     * @returns void.
     */
    importarArquivoConfiguracao(): void {
        const caminhoConfigArquivo = this.resolverArquivoConfiguracao();

        if (caminhoConfigArquivo.valor === false) {
            console.info("Arquivo 'configuracao.delegua' não encontrado.");
            return null;
        }

        try {
            const retornoImportador = this.importador.importar(caminhoConfigArquivo.caminho);

            for (const declaracao of retornoImportador.retornoAvaliadorSintatico.declaracoes) {
                const expressao: DefinirValor = (declaracao as Expressao).expressao as DefinirValor;
                const nomePropriedade: string = expressao.nome.lexema;
                const informacoesVariavel: VariavelInterface = expressao.valor;

                if (expressao.objeto.simbolo.lexema === 'roteador') {
                    this.roteador.ativarMiddleware(nomePropriedade, informacoesVariavel);
                }

                if (expressao.objeto.objeto.simbolo.lexema === 'dados') {
                    if (expressao.objeto.simbolo.lexema === 'lincones') {
                        this.provedorLincones.configurar(nomePropriedade, informacoesVariavel.valor);
                    }
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Retorna o caminho do arquivo de configuração se existir, senão retorna `null`.
     * @param {string} caminhoTotal O caminho para o diretório a ser pesquisado.
     * @returns Um objeto com duas propriedades: caminho e valor.
     */
    resolverArquivoConfiguracao(caminhoTotal: string = ''): RetornoMiddleware {
        const diretorioBase = caminhoTotal === '' ? this.diretorioBase : caminhoTotal;
        const ListaDeItems = sistemaDeArquivos.readdirSync(diretorioBase);

        for (const item of ListaDeItems) {
            if (item === 'configuracao.delegua') {
                return {
                    caminho: caminho.join(diretorioBase, item),
                    valor: true
                } as RetornoMiddleware;
            }
        }
        return {
            caminho: null,
            valor: false
        } as RetornoMiddleware;
    }

    /**
     * Método de descoberta de rotas.
     */
    descobrirRotas(diretorio: string): void {
        const ListaDeItems = sistemaDeArquivos.readdirSync(diretorio);

        const diretorioDescobertos = [];

        ListaDeItems.forEach((diretorioOuArquivo) => {
            const caminhoAbsoluto = caminho.join(diretorio, diretorioOuArquivo);
            if (caminhoAbsoluto.endsWith('.delegua')) {
                this.arquivosDelegua.push(caminhoAbsoluto);
                return null;
            }
            if (sistemaDeArquivos.lstatSync(caminhoAbsoluto).isDirectory()) {
                diretorioDescobertos.push(caminhoAbsoluto);
                return null;
            }
        });

        diretorioDescobertos.forEach((diretorioDescoberto) => {
            this.descobrirRotas(diretorioDescoberto);
        });
    }

    /**
     * Ele pega um caminho de arquivo e retorna uma rota
     * @param {string} caminhoArquivo O caminho do arquivo que está sendo lido
     * @returns A rota resolvida.
     */
    resolverCaminhoRota(caminhoArquivo: string): string {
        const partesArquivo = caminhoArquivo.split('rotas');
        const rotaResolvida = partesArquivo[1]
            .replace('inicial.delegua', '')
            .replace('.delegua', '')
            .replace(new RegExp(`\\${caminho.sep}`, 'g'), '/')
            .replace(new RegExp(`/$`, 'g'), '');
        return rotaResolvida;
    }    

    importarArquivosRotas(): void {
        this.descobrirRotas(caminho.join(this.diretorioBase, 'rotas'));

        try {
            for (const arquivo of this.arquivosDelegua) {
                const retornoImportador = this.importador.importar(arquivo);

                // Liquido espera declarações do tipo Expressao, contendo dentro
                // um Construto do tipo Chamada.
                for (const declaracao of retornoImportador.retornoAvaliadorSintatico.declaracoes) {
                    const expressao: Chamada = (declaracao as Expressao).expressao as Chamada;
                    const entidadeChamada: AcessoMetodo = expressao.entidadeChamada as AcessoMetodo;
                    const objeto = entidadeChamada.objeto as Variavel;
                    const metodo = entidadeChamada.simbolo;
                    if (objeto.simbolo.lexema.toLowerCase() === 'liquido') {
                        switch (metodo.lexema) {
                            case 'rotaGet':
                                this.adicionarRotaGet(this.resolverCaminhoRota(arquivo), expressao.argumentos);
                                break;
                            case 'rotaPost':
                                this.adicionarRotaPost(this.resolverCaminhoRota(arquivo), expressao.argumentos);
                                break;
                            case 'rotaPut':
                                this.adicionarRotaPut(this.resolverCaminhoRota(arquivo), expressao.argumentos);
                                break;
                            case 'rotaDelete':
                                this.adicionarRotaDelete(this.resolverCaminhoRota(arquivo), expressao.argumentos);
                                break;
                            case 'rotaPatch':
                                this.adicionarRotaPatch(this.resolverCaminhoRota(arquivo), expressao.argumentos);
                                break;
                            case 'rotaOptions':
                                this.adicionarRotaOptions(this.resolverCaminhoRota(arquivo), expressao.argumentos);
                                break;
                            case 'rotaCopy':
                                this.adicionarRotaCopy(this.resolverCaminhoRota(arquivo), expressao.argumentos);
                                break;
                            case 'rotaHead':
                                this.adicionarRotaHead(this.resolverCaminhoRota(arquivo), expressao.argumentos);
                                break;
                            case 'rotaLock':
                                this.adicionarRotaLock(this.resolverCaminhoRota(arquivo), expressao.argumentos);
                                break;
                            case 'rotaUnlock':
                                this.adicionarRotaUnlock(this.resolverCaminhoRota(arquivo), expressao.argumentos);
                                break;
                            case 'rotaPurge':
                                this.adicionarRotaPurge(this.resolverCaminhoRota(arquivo), expressao.argumentos);
                                break;
                            case 'rotaPropfind':
                                this.adicionarRotaPropfind(this.resolverCaminhoRota(arquivo), expressao.argumentos);
                                break;
                            default:
                                console.log(`Método ${metodo.lexema} não reconhecido.`);
                                break;
                        }
                    }
                }
            }
        } catch (erro) {
            throw new Error(erro);
        }
    }

    /**
     * O Interpretador Delégua exige alguns parâmetros definidos antes de executar.
     * Esse método define esses parâmetros na posição inicial da pilha de execução
     * do Interpretador.
     * @param requisicao O objeto de requisição do Express.
     * @param nomeFuncao O nome da função a ser chamada pelo Interpretador.
     * @param funcaoConstruto O conteúdo da função, declarada no arquivo `.delegua` correspondente.
     */
    prepararRequisicao(requisicao: any, nomeFuncao: string, funcaoConstruto: FuncaoConstruto): void {
        this.interpretador.pilhaEscoposExecucao.definirVariavel('requisicao', requisicao);
        this.interpretador.pilhaEscoposExecucao.definirVariavel(
            'resposta',
            new Resposta().chamar(this.interpretador, [])
        );

        const funcaoRetorno = new DeleguaFuncao(nomeFuncao, funcaoConstruto);
        this.interpretador.pilhaEscoposExecucao.definirVariavel(nomeFuncao, funcaoRetorno);
    }

    /**
     * Chamada ao Interpretador Delégua com a estrutura declarativa para a
     * execução da função nomeada na rota.
     * @param nomeFuncao O nome da função da rota.
     * @returns O resultado da interpretação.
     */
    async chamarInterpretador(nomeFuncao: string): Promise<RetornoInterpretador> {
        return await this.interpretador.interpretar(
            [
                new Expressao(
                    new Chamada(
                        -1,
                        new Variavel(-1, new Simbolo('IDENTIFICADOR', nomeFuncao, null, -1, -1)),
                        new Simbolo('PARENTESE_DIREITO', '', null, -1, -1),
                        [
                            new Variavel(-1, new Simbolo('IDENTIFICADOR', 'requisicao', null, -1, -1)),
                            new Variavel(-1, new Simbolo('IDENTIFICADOR', 'resposta', null, -1, -1))
                        ]
                    )
                )
            ],
            true
        );
    }

    /**
     * Configuração de uma rota GET no roteador Express.
     * @param caminhoRota O caminho completo do arquivo que define a rota.
     * @param argumentos Todas as funções em Delégua que devem ser executadas
     *                   para a resolução da rota. Por enquanto apenas a primeira
     *                   função é executada.
     */
    adicionarRotaGet(caminhoRota: string, argumentos: Construto[]) {
        const funcao = argumentos[0] as FuncaoConstruto;

        this.roteador.rotaGet(caminhoRota, async (req, res) => {
            this.prepararRequisicao(req, 'funcaoRotaGet', funcao);

            const retorno = await this.chamarInterpretador('funcaoRotaGet');

            // O resultado que interessa é sempre o último.
            // Ele vem como string, e precisa ser desserializado para ser usado.
            const { valor } = JSON.parse(retorno.resultado.pop());
            if (valor.campos.lmht) {
                const resultado = await this.formatadorLmht.formatar(caminhoRota, valor.campos.valores);
                res.send(resultado);
            } else if (valor.campos.mensagem) {
                res.send(valor.campos.mensagem);
            }

            if (valor.campos.statusHttp) {
                res.status(valor.campos.statusHttp);
            }
        });
    }

    adicionarRotaPost(caminhoRota: string, argumentos: Construto[]): void {
        const funcao = argumentos[0] as FuncaoConstruto;

        this.roteador.rotaPost(caminhoRota, async (req, res) => {
            this.prepararRequisicao(req, 'funcaoRotaPost', funcao);

            const retorno = await this.chamarInterpretador('funcaoRotaPost');

            // O resultado que interessa é sempre o último.
            // Ele vem como string, e precisa ser desserializado para ser usado.
            const { valor } = JSON.parse(retorno.resultado.pop());

            if (valor.campos.lmht) {
                const resultado = await this.formatadorLmht.formatar(caminhoRota, valor.campos.valores);
                res.send(resultado);
            } else if (valor.campos.mensagem) {
                res.send(valor.campos.mensagem);
            }

            if (valor.campos.statusHttp) {
                res.status(valor.campos.statusHttp);
            }
        });
    }

    adicionarRotaPut(caminhoRota: string, argumentos: Construto[]): void {
        const funcao = argumentos[0] as FuncaoConstruto;

        this.roteador.rotaPut(caminhoRota, async (req, res) => {
            this.prepararRequisicao(req, 'funcaoRotaPut', funcao);

            const retorno = await this.chamarInterpretador('funcaoRotaPut');

            // O resultado que interessa é sempre o último.
            // Ele vem como string, e precisa ser desserializado para ser usado.
            const { valor } = JSON.parse(retorno.resultado.pop());

            if (valor.campos.lmht) {
                const resultado = await this.formatadorLmht.formatar(caminhoRota, valor.campos.valores);
                res.send(resultado);
            } else if (valor.campos.mensagem) {
                res.send(valor.campos.mensagem);
            }

            if (valor.campos.statusHttp) {
                res.status(valor.campos.statusHttp);
            }
        });
    }

    adicionarRotaDelete(caminhoRota: string, argumentos: Construto[]): void {
        const funcao = argumentos[0] as FuncaoConstruto;

        this.roteador.rotaDelete(caminhoRota, async (req, res) => {
            this.prepararRequisicao(req, 'funcaoRotaDelete', funcao);

            const retorno = await this.chamarInterpretador('funcaoRotaDelete');

            // O resultado que interessa é sempre o último.
            // Ele vem como string, e precisa ser desserializado para ser usado.
            const { valor } = JSON.parse(retorno.resultado.pop());

            if (valor.campos.lmht) {
                const resultado = await this.formatadorLmht.formatar(caminhoRota, valor.campos.valores);
                res.send(resultado);
            } else if (valor.campos.mensagem) {
                res.send(valor.campos.mensagem);
            }

            if (valor.campos.statusHttp) {
                res.status(valor.campos.statusHttp);
            }
        });
    }

    adicionarRotaPatch(caminhoRota: string, argumentos: Construto[]): void {
        const funcao = argumentos[0] as FuncaoConstruto;

        this.roteador.rotaPatch(caminhoRota, async (req, res) => {
            this.prepararRequisicao(req, 'funcaoRotaPatch', funcao);

            const retorno = await this.chamarInterpretador('funcaoRotaPatch');

            // O resultado que interessa é sempre o último.
            // Ele vem como string, e precisa ser desserializado para ser usado.
            const { valor } = JSON.parse(retorno.resultado.pop());

            if (valor.campos.lmht) {
                const resultado = await this.formatadorLmht.formatar(caminhoRota, valor.campos.valores);
                res.send(resultado);
            } else if (valor.campos.mensagem) {
                res.send(valor.campos.mensagem);
            }

            if (valor.campos.statusHttp) {
                res.status(valor.campos.statusHttp);
            }
        });
    }

    adicionarRotaOptions(caminhoRota: string, argumentos: Construto[]): void {
        const funcao = argumentos[0] as FuncaoConstruto;

        this.roteador.rotaOptions(caminhoRota, async (req, res) => {
            this.prepararRequisicao(req, 'funcaoRotaOptions', funcao);

            const retorno = await this.chamarInterpretador('funcaoRotaOptions');

            // O resultado que interessa é sempre o último.
            // Ele vem como string, e precisa ser desserializado para ser usado.
            const { valor } = JSON.parse(retorno.resultado.pop());

            if (valor.campos.lmht) {
                const resultado = await this.formatadorLmht.formatar(caminhoRota, valor.campos.valores);
                res.send(resultado);
            } else if (valor.campos.mensagem) {
                res.send(valor.campos.mensagem);
            }

            if (valor.campos.statusHttp) {
                res.status(valor.campos.statusHttp);
            }
        });
    }

    adicionarRotaCopy(caminhoRota: string, argumentos: Construto[]): void {
        const funcao = argumentos[0] as FuncaoConstruto;

        this.roteador.rotaCopy(caminhoRota, async (req, res) => {
            this.prepararRequisicao(req, 'funcaoRotaCopy', funcao);

            const retorno = await this.chamarInterpretador('funcaoRotaCopy');

            // O resultado que interessa é sempre o último.
            // Ele vem como string, e precisa ser desserializado para ser usado.
            const { valor } = JSON.parse(retorno.resultado.pop());

            if (valor.campos.lmht) {
                const resultado = await this.formatadorLmht.formatar(caminhoRota, valor.campos.valores);
                res.send(resultado);
            } else if (valor.campos.mensagem) {
                res.send(valor.campos.mensagem);
            }

            if (valor.campos.statusHttp) {
                res.status(valor.campos.statusHttp);
            }
        });
    }

    adicionarRotaHead(caminhoRota: string, argumentos: Construto[]): void {
        const funcao = argumentos[0] as FuncaoConstruto;

        this.roteador.rotaHead(caminhoRota, async (req, res) => {
            this.prepararRequisicao(req, 'funcaoRotaHead', funcao);

            const retorno = await this.chamarInterpretador('funcaoRotaHead');

            // O resultado que interessa é sempre o último.
            // Ele vem como string, e precisa ser desserializado para ser usado.
            const { valor } = JSON.parse(retorno.resultado.pop());

            if (valor.campos.lmht) {
                const resultado = await this.formatadorLmht.formatar(caminhoRota, valor.campos.valores);
                res.send(resultado);
            } else if (valor.campos.mensagem) {
                res.send(valor.campos.mensagem);
            }

            if (valor.campos.statusHttp) {
                res.status(valor.campos.statusHttp);
            }
        });
    }

    adicionarRotaLock(caminhoRota: string, argumentos: Construto[]): void {
        const funcao = argumentos[0] as FuncaoConstruto;

        this.roteador.rotaLock(caminhoRota, async (req, res) => {
            this.prepararRequisicao(req, 'funcaoRotaLock', funcao);

            const retorno = await this.chamarInterpretador('funcaoRotaLock');

            // O resultado que interessa é sempre o último.
            // Ele vem como string, e precisa ser desserializado para ser usado.
            const { valor } = JSON.parse(retorno.resultado.pop());

            if (valor.campos.lmht) {
                const resultado = await this.formatadorLmht.formatar(caminhoRota, valor.campos.valores);
                res.send(resultado);
            } else if (valor.campos.mensagem) {
                res.send(valor.campos.mensagem);
            }

            if (valor.campos.statusHttp) {
                res.status(valor.campos.statusHttp);
            }
        });
    }

    adicionarRotaUnlock(caminhoRota: string, argumentos: Construto[]): void {
        const funcao = argumentos[0] as FuncaoConstruto;

        this.roteador.rotaUnlock(caminhoRota, async (req, res) => {
            this.prepararRequisicao(req, 'funcaoRotaUnlock', funcao);

            const retorno = await this.chamarInterpretador('funcaoRotaUnlock');

            // O resultado que interessa é sempre o último.
            // Ele vem como string, e precisa ser desserializado para ser usado.
            const { valor } = JSON.parse(retorno.resultado.pop());

            if (valor.campos.lmht) {
                const resultado = await this.formatadorLmht.formatar(caminhoRota, valor.campos.valores);
                res.send(resultado);
            } else if (valor.campos.mensagem) {
                res.send(valor.campos.mensagem);
            }

            if (valor.campos.statusHttp) {
                res.status(valor.campos.statusHttp);
            }
        });
    }

    adicionarRotaPurge(caminhoRota: string, argumentos: Construto[]): void {
        const funcao = argumentos[0] as FuncaoConstruto;

        this.roteador.rotaPurge(caminhoRota, async (req, res) => {
            this.prepararRequisicao(req, 'funcaoRotaPurge', funcao);

            const retorno = await this.chamarInterpretador('funcaoRotaPurge');

            // O resultado que interessa é sempre o último.
            // Ele vem como string, e precisa ser desserializado para ser usado.
            const { valor } = JSON.parse(retorno.resultado.pop());

            if (valor.campos.lmht) {
                const resultado = await this.formatadorLmht.formatar(caminhoRota, valor.campos.valores);
                res.send(resultado);
            } else if (valor.campos.mensagem) {
                res.send(valor.campos.mensagem);
            }

            if (valor.campos.statusHttp) {
                res.status(valor.campos.statusHttp);
            }
        });
    }

    adicionarRotaPropfind(caminhoRota: string, argumentos: Construto[]): void {
        const funcao = argumentos[0] as FuncaoConstruto;

        this.roteador.rotaPropfind(caminhoRota, async (req, res) => {
            this.prepararRequisicao(req, 'funcaoRotaPropfind', funcao);

            const retorno = await this.chamarInterpretador('funcaoRotaPropfind');

            // O resultado que interessa é sempre o último.
            // Ele vem como string, e precisa ser desserializado para ser usado.
            const { valor } = JSON.parse(retorno.resultado.pop());

            if (valor.campos.lmht) {
                const resultado = await this.formatadorLmht.formatar(caminhoRota, valor.campos.valores);
                res.send(resultado);
            } else if (valor.campos.mensagem) {
                res.send(valor.campos.mensagem);
            }

            if (valor.campos.statusHttp) {
                res.status(valor.campos.statusHttp);
            }
        });
    }
}
