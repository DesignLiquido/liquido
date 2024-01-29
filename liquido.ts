import * as sistemaDeArquivos from 'fs';
import * as caminho from 'path';

import { AvaliadorSintatico } from '@designliquido/delegua/fontes/avaliador-sintatico';
import {
    AcessoMetodoOuPropriedade,
    Chamada,
    Construto,
    DefinirValor,
    FuncaoConstruto,
    Variavel
} from '@designliquido/delegua/fontes/construtos';
import { Expressao } from '@designliquido/delegua/fontes/declaracoes';
import { DeleguaFuncao } from '@designliquido/delegua/fontes/estruturas';
import { VariavelInterface } from '@designliquido/delegua/fontes/interfaces';
import { RetornoInterpretador } from '@designliquido/delegua/fontes/interpretador';
import {
    Lexador,
    Simbolo
} from '@designliquido/delegua/fontes/lexador';

import { Importador } from '@designliquido/delegua-node/fontes/importador';
import { Interpretador } from '@designliquido/delegua-node/fontes/interpretador';
import { FolEs } from '@designliquido/foles';
import { Resposta } from './infraestrutura';
import { FormatadorLmht } from './infraestrutura/formatadores';
import { ProvedorLincones } from './infraestrutura/provedores';
import { MetodoRoteador, Roteador } from './infraestrutura/roteador';
import { LiquidoInterface, RetornoMiddleware } from './interfaces';

/**
 * O núcleo do framework.
 */
export class Liquido implements LiquidoInterface {
    importador: Importador;
    interpretador: Interpretador;
    roteador: Roteador;
    formatadorLmht: FormatadorLmht;
    provedorLincones: ProvedorLincones;
    foles: FolEs;

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

        this.importador = new Importador(
            new Lexador(),
            new AvaliadorSintatico() as any,
            this.arquivosAbertos,
            this.conteudoArquivosAbertos,
            false
        );

        this.formatadorLmht = new FormatadorLmht(this.diretorioBase);
        this.interpretador = new Interpretador(this.importador, process.cwd(), false, console.log);
        this.roteador = new Roteador();
        this.provedorLincones = new ProvedorLincones();
        this.foles = new FolEs(false);
    }

    async iniciar(): Promise<void> {
        this.importarArquivoConfiguracao();
        this.roteador.configurarArquivosEstaticos(this.diretorioEstatico);
        this.roteador.iniciarMiddlewares();
        await this.importarArquivosRotas();

        this.roteador.iniciar();
        if (this.provedorLincones.configurado) {
            this.interpretador.pilhaEscoposExecucao.definirVariavel('lincones', await this.provedorLincones.resolver());
        }

        const arquivosEstilos = this.descobrirEstilos();

        if (!sistemaDeArquivos.existsSync(`./${this.diretorioEstatico}/css`)) {
            sistemaDeArquivos.mkdirSync(`./${this.diretorioEstatico}/css`, { recursive: true });
        }

        for (const arquivo of arquivosEstilos) {
            const teste = this.foles.converterParaCss(arquivo);
            const arquivoDestino = caminho.join(process.cwd(), `./${this.diretorioEstatico}/css`, arquivo.replace('estilos', '').replace('.foles', '.css'));
            sistemaDeArquivos.writeFile(arquivoDestino, teste, (erro) => {
                if (erro) {
                    return console.log(erro);
                }

                console.log(`Salvo: ${arquivoDestino}`);
            });
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
                const objetoAlvo: AcessoMetodoOuPropriedade = expressao.objeto as AcessoMetodoOuPropriedade;
                const nomePropriedade: string = expressao.nome.lexema;
                const informacoesVariavel: VariavelInterface = expressao.valor;

                switch (objetoAlvo.simbolo.lexema) {
                    case 'roteador':
                        this.roteador.ativarMiddleware(nomePropriedade, informacoesVariavel);
                        break;
                    case 'autenticacao':
                        if (nomePropriedade === 'tecnologia') {
                            switch (informacoesVariavel.valor) {
                                case 'jwt':
                                    this.roteador.ativarDesativarPassport(true);
                                    break;
                                default:
                                    console.error('Tecnologia de autenticação não suportada.');
                            }
                        }
                        break;
                    case 'lincones': { 
                            const objetoLinconesAlvo: AcessoMetodoOuPropriedade = objetoAlvo.objeto as AcessoMetodoOuPropriedade;
                            switch (objetoLinconesAlvo.simbolo.lexema) {
                                case 'dados':
                                    this.provedorLincones.configurar(nomePropriedade, informacoesVariavel.valor);
                                    break;
                                // Casos futuros aqui.
                            }
                        }
                        
                        break;
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
     * Método de descoberta de rotas. Recursivo.
     * @param diretorio O diretório a ser pesquisado.
     */
    descobrirRotas(diretorio: string): void {
        const listaDeItems = sistemaDeArquivos.readdirSync(diretorio);

        const diretorioDescobertos = [];

        listaDeItems.forEach((diretorioOuArquivo) => {
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

    descobrirEstilos(): any[] {
        try {
            const listaDeItems = sistemaDeArquivos.readdirSync('./estilos');

            const arquivosDescobertos = [];

            listaDeItems.forEach((diretorioOuArquivo) => {
                const caminhoAbsoluto = caminho.join('./estilos', diretorioOuArquivo);
                if (caminhoAbsoluto.endsWith('.foles')) {
                    arquivosDescobertos.push(caminhoAbsoluto);
                }
            });

            return arquivosDescobertos;
        } catch (erro: any) {
            console.log(`Pulando descoberta de estilos. Causa: ${erro}`);
            return [];
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
            const retornoImportador = this.importador.importar(arquivo);

            // Liquido espera declarações do tipo Expressao, contendo dentro
            // um Construto do tipo Chamada.
            for (const declaracao of retornoImportador.retornoAvaliadorSintatico.declaracoes) {
                const expressao: Chamada = (declaracao as Expressao).expressao as Chamada;
                const entidadeChamada: AcessoMetodoOuPropriedade = expressao.entidadeChamada as AcessoMetodoOuPropriedade;
                const objeto = entidadeChamada.objeto as Variavel;
                const metodo = entidadeChamada.simbolo;
                if (objeto.simbolo.lexema.toLowerCase() === 'liquido') {
                    switch (metodo.lexema) {
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
                            await this.adicionarRota(metodo.lexema, this.resolverCaminhoRota(arquivo), expressao.argumentos);
                            break;
                        default:
                            console.log(`Método ${metodo.lexema} não reconhecido.`);
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
        this.interpretador.pilhaEscoposExecucao.definirVariavel('requisicao', requisicao);
        const classeResposta = new Resposta();
        this.interpretador.pilhaEscoposExecucao.definirVariavel(
            'resposta',
            await classeResposta.chamar(this.interpretador as any, [])
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
        try {
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
        } catch (erro: any) {
            console.error(erro);
        }
    }

    private async logicaComumResultadoInterpretador(
        caminhoRota: string,
        retornoInterpretador: RetornoInterpretador
    ): Promise<{ corpoRetorno?: any; statusHttp?: number, redirecionamento?: string }> {
        // O resultado que interessa é sempre o último.
        // Ele vem como string, e precisa ser desserializado para ser usado.

        const { valor } = JSON.parse(retornoInterpretador.resultado.pop());

        let statusHttp: number = 200;
        if (valor.propriedades.statusHttp) {
            statusHttp = valor.propriedades.statusHttp;
        }
        
        if (valor.propriedades.destino) {
            // Redirecionamento
            return { redirecionamento: valor.propriedades.destino };
        }
        
        if (valor.propriedades.lmht) {
            try {
                let visao: string = caminhoRota;
                // Verifica se foi definida uma preferência de visão.
                // Se não foi, usa o sufixo da rota como visão correspondente.
                // Por exemplo, `/rotas/inicial.delegua` tem como visão correspondente `/visoes/inicial.lmht`.
                if (valor.propriedades.visao) {
                    const partesRota = caminhoRota.split('/');
                    partesRota.pop();
                    visao = partesRota.join('/') + '/' + valor.propriedades.visao;
                }

                const resultadoFormatacaoLmht = await this.formatadorLmht.formatar(visao, valor.propriedades.valores);
                return {
                    corpoRetorno: resultadoFormatacaoLmht,
                    statusHttp: statusHttp
                };
            } catch (erro: any) {
                console.log(`Erro ao processar LMHT: ${erro}`);
            }
        }
        
        if (valor.propriedades.mensagem) {
            return {
                corpoRetorno: valor.propriedades.mensagem,
                statusHttp: statusHttp
            };
        }
    }

    /**
     * Configuração de uma rota no roteador Express.
     * @param metodoRoteador O método da rota.
     * @param caminhoRota O caminho completo do arquivo que define a rota.
     * @param argumentos Todas as funções em Delégua que devem ser executadas
     *                   para a resolução da rota. Por enquanto apenas a primeira
     *                   função é executada.
     */
    async adicionarRota(metodoRoteador: string, caminhoRota: string, argumentos: Construto[]): Promise<void> {
        const funcao = argumentos[0] as FuncaoConstruto;
        const metodoResolvido = MetodoRoteador[metodoRoteador.replace('rota', '')];

        this.roteador.mapaRotas[metodoResolvido](caminhoRota, async (req, res) => {
            await this.prepararRequisicao(req, `funcaoRota${metodoRoteador}`, funcao);

            const retornoInterpretador = await this.chamarInterpretador(`funcaoRota${metodoRoteador}`);
            const corpoEStatus = await this.logicaComumResultadoInterpretador(caminhoRota, retornoInterpretador);
            if (corpoEStatus.redirecionamento) {
                res.redirect(corpoEStatus.redirecionamento);
            } else {
                res.send(corpoEStatus.corpoRetorno).status(corpoEStatus.statusHttp);
            }
        });
    }
}
