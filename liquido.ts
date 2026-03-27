import * as sistemaDeArquivos from 'fs';
import * as caminho from 'path';

import { AvaliadorSintaticoComImportacao } from '@designliquido/delegua-node/avaliador-sintatico/avaliador-sintatico-com-importacao';
import { AcessoMetodo, Chamada, FuncaoConstruto, Variavel } from '@designliquido/delegua/construtos';
import { Expressao, FuncaoDeclaracao } from '@designliquido/delegua/declaracoes';
import { DeleguaFuncao, ObjetoDeleguaClasse } from '@designliquido/delegua/interpretador/estruturas';
import { InterpretadorInterface, ResultadoParcialInterpretadorInterface, RetornoInterpretadorInterface, SimboloInterface, VariavelInterface } from '@designliquido/delegua/interfaces';
import { InformacaoElementoSintatico } from '@designliquido/delegua/informacao-elemento-sintatico';
import { Lexador, Simbolo } from '@designliquido/delegua/lexador';

import { Importador } from '@designliquido/delegua-node/importador';

import { FolEs } from '@designliquido/foles';

import { Resposta } from './infraestrutura';
import { FormatadorLmht } from './infraestrutura/formatadores';
import { ProvedorLincones } from './infraestrutura/provedores';
import { MetodoRoteador, Roteador } from './infraestrutura/roteador';
import { CorpoResposta, LiquidoInterface, RetornoConfiguracaoInterface } from './interfaces';
import { CentroConfiguracoes } from './infraestrutura/centro-configuracoes';
import { AspectoConfiguracaoInterface } from './infraestrutura/centro-configuracoes/aspecto-configuracao-interface';
import { AutoDocumentador } from './infraestrutura/auto-documentacao/auto-documentador';
import { Requisicao } from './infraestrutura/requisicao';
import { InterpretadorLiquido } from './infraestrutura/interpretador-liquido';
import { RetornoQuebra } from '@designliquido/delegua/quebras';

/**
 * O núcleo do framework.
 */
export class Liquido implements LiquidoInterface {
    importador: Importador;
    avaliadorSintatico: AvaliadorSintaticoComImportacao;
    interpretador: InterpretadorInterface;
    roteador: Roteador;
    formatadorLmht: FormatadorLmht;
    provedorLincones: ProvedorLincones;
    foles: FolEs;
    centroConfiguracoes: CentroConfiguracoes;
    autoDocumentador: AutoDocumentador;

    arquivosDelegua: string[];
    rotasDelegua: string[];
    diretorioBase: string;
    diretorioDescobertos: string[];
    diretorioEstatico: string;

    arquivosAbertos: { [identificador: string]: string };
    conteudoArquivosAbertos: { [identificador: string]: string[] };

    constructor(diretorioBase: string) {
        this.arquivosAbertos = {};
        this.conteudoArquivosAbertos = {};
        this.arquivosDelegua = [];
        this.rotasDelegua = [];
        this.diretorioDescobertos = [];
        this.diretorioBase = diretorioBase;
        this.diretorioEstatico = 'publico';

        this.importador = new Importador(new Lexador(), this.arquivosAbertos, this.conteudoArquivosAbertos, false);

        this.avaliadorSintatico = new AvaliadorSintaticoComImportacao(this.importador);
        this.avaliadorSintatico.tiposDeFerramentasExternas = {
            liquido: {
                lincones: 'módulo',
                liquido: 'módulo',
                requisicao: 'módulo',
                resposta: 'módulo'
            }
        };

        this.formatadorLmht = new FormatadorLmht(this.diretorioBase);
        this.interpretador = new InterpretadorLiquido(this.importador, process.cwd(), false, console.log);
        this.autoDocumentador = new AutoDocumentador();
        this.roteador = new Roteador(this.autoDocumentador);
        this.provedorLincones = new ProvedorLincones();
        this.foles = new FolEs(false);
    }

    async iniciar(): Promise<void> {
        await this.importarArquivoConfiguracao();
        this.roteador.configurarArquivosEstaticos(this.diretorioEstatico);
        this.roteador.iniciarMiddlewares();
        await this.importarArquivosRotas();

        this.roteador.iniciar();
        if (this.provedorLincones.configurado) {
            this.interpretador.pilhaEscoposExecucao.definirVariavel(
                'lincones',
                await this.provedorLincones.resolver()
            );
        }

        this.escreverEstilos();
    }

    /**
     * Método de importação do arquivo `configuracao.delegua`.
     * @returns void.
     */
    async importarArquivoConfiguracao(): Promise<void> {
        const caminhoConfigArquivo = this.resolverArquivoConfiguracao();

        if (caminhoConfigArquivo.valor === false) {
            console.info("Arquivo 'configuracao.delegua' não encontrado.");
            return;
        }

        try {
            const retornoImportador = this.importador.importar(caminhoConfigArquivo.caminho, -1);
            const retornoAvaliadorSintatico = await this.avaliadorSintatico.analisar(
                retornoImportador.retornoLexador,
                retornoImportador.hashArquivo
            );

            if (retornoAvaliadorSintatico.erros.length > 0) {
                let mensagemCompleta = "";
                for (const erro of retornoAvaliadorSintatico.erros) {
                    mensagemCompleta += `[Linha ${erro.linha}] Erro no arquivo de configuração: ${erro.message}\n`;
                }
                throw new Error(mensagemCompleta);
            }

            this.centroConfiguracoes = new CentroConfiguracoes(retornoAvaliadorSintatico.declaracoes);

            for (const [chave, configuracao] of Object.entries(this.centroConfiguracoes)) {
                switch (chave) {
                    case 'liquido':
                        const configuracaoTipada = configuracao as AspectoConfiguracaoInterface;
                        configuracaoTipada.configurar({
                            autoDocumentador: this.autoDocumentador,
                            roteador: this.roteador,
                            provedorLincones: this.provedorLincones
                        });
                        break;
                    default:
                        throw new Error(`Chave de configuração desconhecida: ${chave}`);
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Retorna o caminho do arquivo de configuração se existir.
     * @param {string} caminhoTotal O caminho para o diretório a ser pesquisado.
     * @returns Um objeto com duas propriedades: `caminho` e `valor`. Se o caminho foi
     *          encontrado, `valor` será `true`, e `caminho` terá o caminho completo
     *          do arquivo de configuração. Caso contrário, `valor` será `false`, e
     *          `caminho` será nulo.
     */
    resolverArquivoConfiguracao(caminhoTotal: string = ''): RetornoConfiguracaoInterface {
        const diretorioBase = caminhoTotal === '' ? this.diretorioBase : caminhoTotal;
        let listaDeArquivos: string[];
        try {
            listaDeArquivos = sistemaDeArquivos.readdirSync(diretorioBase);
        } catch {
            return { caminho: null, valor: false } as RetornoConfiguracaoInterface;
        }

        for (const arquivo of listaDeArquivos) {
            if (arquivo === 'configuracao.delegua') {
                return { caminho: caminho.join(diretorioBase, arquivo), valor: true } as RetornoConfiguracaoInterface;
            }
        }

        return { caminho: null, valor: false } as RetornoConfiguracaoInterface;
    }

    /**
     * Método de descoberta de rotas. Recursivo.
     * @param diretorio O diretório a ser pesquisado.
     */
    descobrirRotas(diretorio: string): void {
        const listaDeRotas = sistemaDeArquivos.readdirSync(diretorio);

        const diretorioDescobertos = [];

        listaDeRotas.forEach((diretorioOuArquivo) => {
            const caminhoAbsoluto = caminho.join(diretorio, diretorioOuArquivo);
            if (caminhoAbsoluto.endsWith('.delegua')) {
                this.arquivosDelegua.push(caminhoAbsoluto);
                return;
            }

            if (sistemaDeArquivos.lstatSync(caminhoAbsoluto).isDirectory()) {
                diretorioDescobertos.push(caminhoAbsoluto);
            }
        });

        diretorioDescobertos.forEach((diretorioDescoberto) => {
            this.descobrirRotas(diretorioDescoberto);
        });
    }

    descobrirEstilos(): string[] {
        try {
            const listaDeEstilos = sistemaDeArquivos.readdirSync('./estilos');

            const arquivosDescobertos = [];

            listaDeEstilos.forEach((diretorioOuArquivo) => {
                const caminhoAbsoluto = caminho.join('./estilos', diretorioOuArquivo);
                if (caminhoAbsoluto.endsWith('.foles')) {
                    arquivosDescobertos.push(caminhoAbsoluto);
                }
            });

            return arquivosDescobertos;
        } catch (erro: any) {
            console.error(`Pulando descoberta de estilos. Causa: ${erro}.`);
            return [];
        }
    }

    escreverEstilos() {
        const arquivosEstilos = this.descobrirEstilos();

        if (!sistemaDeArquivos.existsSync(`./${this.diretorioEstatico}/css`)) {
            sistemaDeArquivos.mkdirSync(`./${this.diretorioEstatico}/css`, { recursive: true });
        }

        for (const arquivo of arquivosEstilos) {
            const teste = this.foles.converterParaCss(arquivo);
            const arquivoDestino = caminho.join(
                process.cwd(),
                `./${this.diretorioEstatico}/css`,
                arquivo.replace('estilos', '').replace('.foles', '.css')
            );
            sistemaDeArquivos.writeFile(arquivoDestino, teste, (erro) => {
                if (erro) {
                    return console.log(erro);
                }

                console.log(`Salvo: ${arquivoDestino}`);
            });
        }
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
            .replace(new RegExp(`/$`, 'g'), '')
            .replace(new RegExp(`\\[(.+)\\]`, 'g'), ':$1');
        return rotaResolvida;
    }

    async importarArquivosRotas(): Promise<void> {
        this.descobrirRotas(caminho.join(this.diretorioBase, 'rotas'));

        for (const arquivo of this.arquivosDelegua) {
            const retornoImportador = this.importador.importar(arquivo, -1);
            const retornoAvaliadorSintatico = await this.avaliadorSintatico.analisar(
                retornoImportador.retornoLexador,
                retornoImportador.hashArquivo
            );

            if (retornoAvaliadorSintatico.erros.length > 0) {
                for (const erro of retornoAvaliadorSintatico.erros) {
                    console.error(`[Linha ${erro.linha}] Erro na rota ${arquivo}: ${erro.message}`);
                }
                continue;
            }

            // Primeiro passo: coletar todas as declarações de funções (middlewares/handlers)
            const funcaoDeclaracoes: Map<string, FuncaoConstruto> = new Map();
            for (const declaracao of retornoAvaliadorSintatico.declaracoes) {
                if (declaracao instanceof FuncaoDeclaracao) {
                    funcaoDeclaracoes.set(declaracao.simbolo.lexema, declaracao.funcao);
                }
            }

            // Segundo passo: processar registros de rotas e resolver referências a funções
            for (const declaracao of retornoAvaliadorSintatico.declaracoes) {
                // Ignora declarações que não são expressões (ex: Funcao para middlewares)
                if (!(declaracao instanceof Expressao)) {
                    continue;
                }

                const expressao: Chamada = declaracao.expressao as Chamada;
                const entidadeChamada: AcessoMetodo = expressao.entidadeChamada as AcessoMetodo;
                const objeto = entidadeChamada.objeto as Variavel;

                if (objeto.simbolo.lexema.toLowerCase() === 'liquido') {
                    switch (entidadeChamada.nomeMetodo) {
                        case 'rotaGet':
                        case 'rotaPost':
                        case 'rotaPut':
                        case 'rotaDelete':
                        case 'rotaPatch':
                        case 'rotaOptions':
                        case 'rotaCopy':
                        case 'rotaHead':
                        case 'rotaLock':
                        case 'rotaUnlock':
                        case 'rotaPurge':
                        case 'rotaPropfind':
                            // Resolve argumentos: converte Variavel em FuncaoConstruto
                            const argumentosResolvidos: FuncaoConstruto[] = [];
                            for (const argumento of expressao.argumentos) {
                                if (argumento instanceof Variavel) {
                                    // Referência a função declarada
                                    const nomeFuncao = argumento.simbolo.lexema;
                                    if (funcaoDeclaracoes.has(nomeFuncao)) {
                                        argumentosResolvidos.push(funcaoDeclaracoes.get(nomeFuncao));
                                    } else {
                                        console.error(`Função '${nomeFuncao}' referenciada mas não encontrada em ${arquivo}`);
                                    }
                                } else if (argumento instanceof FuncaoConstruto) {
                                    // Função inline/anônima
                                    argumentosResolvidos.push(argumento);
                                } else {
                                    console.error(`Argumento de rota inválido em ${arquivo}: esperado função ou referência a função`);
                                }
                            }

                            await this.adicionarRota(
                                entidadeChamada.nomeMetodo,
                                this.resolverCaminhoRota(arquivo),
                                argumentosResolvidos
                            );
                            break;
                        default:
                            console.error(`Método ${entidadeChamada.nomeMetodo} não reconhecido.`);
                            break;
                    }
                }
            }
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
    async prepararRequisicao(requisicao: any, nomeFuncao: string, funcaoConstruto: FuncaoConstruto): Promise<void> {
        this.avaliadorSintatico.pilhaEscopos.definirInformacoesVariavel('liquido', new InformacaoElementoSintatico('liquido', 'módulo'));
        this.avaliadorSintatico.pilhaEscopos.definirInformacoesVariavel('requisicao', new InformacaoElementoSintatico('requisicao', 'módulo'));
        this.avaliadorSintatico.pilhaEscopos.definirInformacoesVariavel('resposta', new InformacaoElementoSintatico('resposta', 'módulo'));
        const descritorClasseRequisicao = new Requisicao(requisicao);
        await descritorClasseRequisicao.chamar(this.interpretador, []);
        const instanciaRequisicao = new ObjetoDeleguaClasse(descritorClasseRequisicao);
        instanciaRequisicao.definir({ lexema: 'corpo' } as SimboloInterface, requisicao.body);
        instanciaRequisicao.definir({ lexema: 'parametros' } as SimboloInterface, requisicao.params);
        instanciaRequisicao.definir({ lexema: 'parametrosPesquisa' } as SimboloInterface, requisicao.query || {});
        instanciaRequisicao.definir({ lexema: 'parametrosCaminho' } as SimboloInterface, requisicao.path);
        this.interpretador.pilhaEscoposExecucao.definirVariavel(
            'requisicao',
            instanciaRequisicao
        );

        const descritorClasseResposta = new Resposta();
        await descritorClasseResposta.chamar(this.interpretador, []);
        this.interpretador.pilhaEscoposExecucao.definirVariavel(
            'resposta',
            new ObjetoDeleguaClasse(descritorClasseResposta)
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
    async chamarInterpretador(nomeFuncao: string): Promise<RetornoInterpretadorInterface> {
        try {
            return await this.interpretador.interpretar(
                [
                    new Expressao(
                        new Chamada(-1, new Variavel(-1, new Simbolo('IDENTIFICADOR', nomeFuncao, null, -1, -1)), [
                            new Variavel(-1, new Simbolo('IDENTIFICADOR', 'requisicao', null, -1, -1)),
                            new Variavel(-1, new Simbolo('IDENTIFICADOR', 'resposta', null, -1, -1))
                        ])
                    )
                ],
                true
            );
        } catch (erro: any) {
            console.error(erro);
        }
    }

    private logicaComumErrosInterpretacao(retornoInterpretador: RetornoInterpretadorInterface): {
        corpoRetorno?: any;
        statusHttp?: number;
        redirecionamento?: string;
    } {
        let corpoRetorno = '';
        for (const erro of retornoInterpretador.erros) {
            if (erro.erroInterno) {
                const erroInternoTipado: { message: string; stack: string } = erro.erroInterno;
                corpoRetorno += erroInternoTipado.message;
                corpoRetorno += erroInternoTipado.stack;
            } else {
                corpoRetorno += `[Linha ${erro.linha}]: ${erro.mensagem}`;
            }
        }

        return { corpoRetorno: corpoRetorno, statusHttp: 500 };
    }

    /**
     * Lógica para processamento da resposta como uma visão LMHT.
     * @param caminhoRota O caminho da rota da requisição.
     * @param statusHttp O status HTTP pré-calculado.
     * @param propriedades Propriedades da resposta, usadas para escolher a visão e parametrizá-la.
     * @returns Um objeto com o corpo do retorno e o status HTTP correspondente.
     */
    private async logicaComumRespostaVisaoLmht(caminhoRota: string, statusHttp: number, propriedades: {[nome: string]: any}) {
        try {
            let visao: string = caminhoRota;
            // Verifica se foi definida uma preferência de visão.
            // Se não foi, usa o sufixo da rota como visão correspondente.
            // Por exemplo, `/rotas/inicial.delegua` tem como visão correspondente `/visoes/inicial.lmht`.
            if (propriedades.visao) {
                const partesRota = caminhoRota.split('/');
                partesRota.pop();
                visao = partesRota.join('/') + '/' + propriedades.visao;
            }

            const resultadoFormatacaoLmht = await this.formatadorLmht.formatar(
                visao,
                propriedades.valores
            );
            return { corpoRetorno: resultadoFormatacaoLmht, statusHttp: statusHttp };
        } catch (erro: any) {
            console.error(`Erro ao processar LMHT: ${erro}.`);
        }
    }

    private async logicaComumResultadoInterpretador(
        caminhoRota: string,
        retornoInterpretador: RetornoInterpretadorInterface
    ): Promise<CorpoResposta> {
        if (retornoInterpretador.erros.length > 0) {
            return this.logicaComumErrosInterpretacao(retornoInterpretador);
        }

        // Verifica se há resultado da interpretação
        if (!retornoInterpretador.resultado || retornoInterpretador.resultado.length === 0) {
            // Middleware não retornou nada - continuar para próximo middleware
            return {};
        }

        // O resultado que interessa é sempre o último.
        // Pela natureza de Delégua, este resultado precisa ser desenvelopado
        // até obtermos o objeto de resposta, que contém as instruções para
        // resolver a requisição.
        const representacaoObjeto = retornoInterpretador.resultado.pop() as ResultadoParcialInterpretadorInterface;

        // Valida se o objeto de representação existe e tem valorRetornado
        if (!representacaoObjeto || !representacaoObjeto.valorRetornado) {
            // Middleware não retornou resposta - continuar para próximo middleware
            return {};
        }

        const valorRetornado: RetornoQuebra = representacaoObjeto.valorRetornado;

        // Valida se valorRetornado tem valor
        if (!valorRetornado || !valorRetornado.valor) {
            // Middleware não retornou resposta - continuar para próximo middleware
            return {};
        }

        const informacoesObjeto: VariavelInterface | any = valorRetornado.valor;
        const objetoResposta: ObjetoDeleguaClasse = informacoesObjeto.hasOwnProperty('valor') ?
            informacoesObjeto.valor :
            informacoesObjeto;

        // Valida se objetoResposta tem propriedades
        if (!objetoResposta || !objetoResposta.propriedades) {
            // Middleware não retornou resposta - continuar para próximo middleware
            return {};
        }

        let statusHttp: number = 200;
        if (objetoResposta.propriedades.statusHttp) {
            statusHttp = objetoResposta.propriedades.statusHttp;
        }

        if (objetoResposta.propriedades.destino) {
            // Redirecionamento
            return { redirecionamento: objetoResposta.propriedades.destino };
        }

        if (objetoResposta.propriedades.lmht) {
            return this.logicaComumRespostaVisaoLmht(caminhoRota, statusHttp, objetoResposta.propriedades);
        }

        if (objetoResposta.propriedades.respostaJson) {
            // TODO: Por que valor é sempre um array aqui?
            const jsonBruto = objetoResposta.propriedades.respostaJson;

            const dadoParaLimpar = (
                jsonBruto &&
                typeof jsonBruto === 'object' &&
                'valor' in jsonBruto
            )
                ? jsonBruto.valor
                : jsonBruto;

            return {
                corpoRetorno: this.limparObjeto(dadoParaLimpar),
                tipoConteudo: 'JSON',
                statusHttp: statusHttp
            };
        }

        if (objetoResposta.propriedades.mensagem) {
            return { corpoRetorno: objetoResposta.propriedades.mensagem, statusHttp: statusHttp };
        }

        // Middleware não enviou resposta (apenas executou lógica) - continuar para próximo middleware
        return {};
    }

    /**
     * Verifica se uma resposta foi definida pelo middleware ou handler.
     * @param corpoEStatus O objeto de resposta retornado pelo interpretador.
     * @returns Verdadeiro se alguma resposta foi definida, falso caso contrário.
     */
    private respostaFoiDefinida(corpoEStatus: CorpoResposta): boolean {
        if (!corpoEStatus) return false;
        return !!(
            corpoEStatus.corpoRetorno ||
            corpoEStatus.redirecionamento ||
            corpoEStatus.statusHttp
        );
    }

    /**
     * Executa uma função (middleware ou handler) no contexto do interpretador.
     * @param req O objeto de requisição do Express.
     * @param caminhoRota O caminho da rota.
     * @param funcao A função a ser executada.
     * @param nomeFuncao O nome único para identificar a função no interpretador.
     * @returns O corpo e status da resposta, se houver.
     */
    private async executarFuncaoRota(
        req: any,
        caminhoRota: string,
        funcao: FuncaoConstruto,
        nomeFuncao: string
    ): Promise<CorpoResposta> {
        await this.prepararRequisicao(req, nomeFuncao, funcao);
        const retornoInterpretador = await this.chamarInterpretador(nomeFuncao);
        return await this.logicaComumResultadoInterpretador(caminhoRota, retornoInterpretador);
    }

    /**
     * Configuração de uma rota no roteador Express.
     * @param metodoRoteador O método da rota.
     * @param caminhoRota O caminho completo do arquivo que define a rota.
     * @param argumentos Todas as funções em Delégua que devem ser executadas
     *                   para a resolução da rota. O último argumento é o handler final,
     *                   todos os anteriores são middlewares executados em sequência.
     */
    async adicionarRota(metodoRoteador: string, caminhoRota: string, argumentos: FuncaoConstruto[]): Promise<void> {
        if (argumentos.length === 0) {
            console.error(`Rota ${caminhoRota} não possui nenhuma função definida.`);
            return;
        }

        // Separa middlewares (todos menos o último) e handler (último argumento)
        const middlewares = argumentos.slice(0, -1);
        const handler = argumentos[argumentos.length - 1];
        const metodoResolvido = MetodoRoteador[metodoRoteador.replace('rota', '')];

        this.roteador.mapaRotas[metodoResolvido](caminhoRota, async (req, res) => {
            let corpoEStatus: CorpoResposta = null;

            // Executa middlewares em sequência
            for (let i = 0; i < middlewares.length; i++) {
                const middleware = middlewares[i];
                const nomeMiddleware = `middleware${i}_${metodoRoteador}`;

                corpoEStatus = await this.executarFuncaoRota(req, caminhoRota, middleware, nomeMiddleware);

                // Se o middleware enviou uma resposta, para a execução
                if (this.respostaFoiDefinida(corpoEStatus)) {
                    break;
                }
            }

            // Se nenhum middleware enviou resposta, executa o handler final
            if (!this.respostaFoiDefinida(corpoEStatus)) {
                corpoEStatus = await this.executarFuncaoRota(req, caminhoRota, handler, `handler_${metodoRoteador}`);
            }

            // Envia a resposta
            if (corpoEStatus.redirecionamento) {
                res.redirect(corpoEStatus.redirecionamento);
            } else {
                res.send(corpoEStatus.corpoRetorno).status(corpoEStatus.statusHttp);
            }
        });
    }

    private limparObjeto(item: any): any {
        if (item === null || item === undefined || typeof item !== 'object') {
            return item;
        }

        if (Array.isArray(item)) {
            return item.map((i) => this.limparObjeto(i));
        }

        if ('valor' in item && item.valor !== undefined) {
            return this.limparObjeto(item.valor);
        }

        if ('propriedades' in item && item.propriedades) {
            const novoObjeto = {};
            const propriedades = item.propriedades;

            for (const [chave, valorProp] of Object.entries(propriedades)) {
                novoObjeto[chave] = this.limparObjeto(valorProp);
            }

            return novoObjeto;
        }

        return item;
    }
}
