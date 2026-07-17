import * as sistemaDeArquivos from 'fs';
import * as caminho from 'path';

import { AvaliadorSintaticoLiquido, AvaliadorSintaticoLiquidoPitugues } from './infraestrutura/avaliadores-sintaticos';
import { AcessoMetodo, AcessoMetodoOuPropriedade, Chamada, FuncaoConstruto, Variavel } from '@designliquido/delegua/construtos';
import { Expressao, FuncaoDeclaracao } from '@designliquido/delegua/declaracoes'
import { DeleguaFuncao, ObjetoDeleguaClasse } from '@designliquido/delegua/interpretador/estruturas';
import { ReferenciaMontao } from '@designliquido/delegua/interpretador/estruturas/referencia-montao';
import {
    ErroInterpretadorInterface,
    InterpretadorInterface,
    ResultadoParcialInterpretadorInterface,
    RetornoInterpretadorInterface,
    SimboloInterface,
    VariavelInterface
} from '@designliquido/delegua/interfaces';
import { RetornoLexadorInterface } from '@designliquido/delegua/interfaces/retornos/retorno-lexador-interface';
import { InformacaoElementoSintatico } from '@designliquido/delegua/informacao-elemento-sintatico';
import { Lexador, LexadorPitugues, Simbolo } from '@designliquido/delegua/lexador';

import { Importador } from '@designliquido/delegua-node/importador';

import { FolEs } from '@designliquido/foles';

import { Resposta } from './infraestrutura';
import { FormatadorLmht } from './infraestrutura/formatadores';
import { ProvedorLincones } from './infraestrutura/provedores';
import { inicializarBancoLincones, inicializarBancoDeleguaEntidades } from './interface-linha-comando';
import { MetodoRoteador, Roteador } from './infraestrutura/roteador';
import { CorpoResposta, LiquidoInterface, RetornoConfiguracaoInterface } from './interfaces';
import { CentroConfiguracoes } from './infraestrutura/centro-configuracoes';
import { AspectoConfiguracaoInterface } from './infraestrutura/centro-configuracoes/aspecto-configuracao-interface';
import { AutoDocumentador } from './infraestrutura/auto-documentacao/auto-documentador';
import { Requisicao } from './infraestrutura/requisicao';
import { InterpretadorLiquido, InterpretadorLiquidoPitugues } from './infraestrutura/interpretador-liquido';
import { RetornoQuebra } from '@designliquido/delegua/quebras';
import { listaDeErros } from './erros';
import { Declaracao } from '@designliquido/foles/declaracoes';

/**
 * O núcleo do framework.
 */
export class Liquido implements LiquidoInterface {
    importador: Importador | undefined = undefined;
    avaliadorSintatico: AvaliadorSintaticoLiquido | AvaliadorSintaticoLiquidoPitugues | undefined = undefined;
    interpretador: InterpretadorInterface | undefined = undefined;
    roteador: Roteador;
    formatadorLmht: FormatadorLmht;
    provedorLincones: ProvedorLincones;
    foles: FolEs;
    centroConfiguracoes!: CentroConfiguracoes;
    autoDocumentador: AutoDocumentador;
    private classeContextoEntidades: any = null;

    arquivosDelegua: string[];
    arquivosPitugues: string[];
    rotasDelegua: string[];
    rotasPitugues: string[];
    diretorioBase: string;
    diretorioDescobertos: string[];
    diretorioEstatico: string;

    arquivosAbertos: { [identificador: string]: string };
    conteudoArquivosAbertos: { [identificador: string]: string[] };

    constructor(diretorioBase: string) {
        this.arquivosAbertos = {};
        this.conteudoArquivosAbertos = {};
        this.arquivosDelegua = [];
        this.arquivosPitugues = [];
        this.rotasDelegua = [];
        this.rotasPitugues = [];
        this.diretorioDescobertos = [];
        this.diretorioBase = diretorioBase;
        this.diretorioEstatico = 'publico';

        this.configurarPipelineLinguagem('delegua');

        this.formatadorLmht = new FormatadorLmht(this.diretorioBase);
        this.autoDocumentador = new AutoDocumentador();
        this.roteador = new Roteador(this.autoDocumentador);
        this.provedorLincones = new ProvedorLincones();
        this.foles = new FolEs(false);
    }

    async iniciar(): Promise<void> {
        await this.importarArquivoConfiguracao();

        const linguagemSelecionada = this
            .centroConfiguracoes?.liquido?.linguagem || 'delegua';

        this.configurarPipelineLinguagem(linguagemSelecionada);

        if (this.provedorLincones.configurado && this.interpretador) {
            const moduloLincones = await this.provedorLincones.resolver();

            const dados = this.centroConfiguracoes?.liquido?.dados;
            if (dados?.lincones?.autoInicializar) {
                try {
                    if (dados.motor === 'delegua-entidades') {
                        await inicializarBancoDeleguaEntidades(
                            dados.lincones.tecnologia ?? '',
                            dados.lincones.caminho ?? '',
                            false,
                            false,
                            this.provedorLincones.instancia
                        );
                    } else {
                        await inicializarBancoLincones(
                            dados.lincones.tecnologia ?? '',
                            dados.lincones.caminho ?? '',
                            dados.lincones.arquivoInicializacao,
                            false,
                            false,
                            this.provedorLincones.instancia
                        );
                    }
                } catch (erro: any) {
                    console.warn(`[Liquido] Inicialização automática do banco de dados falhou: ${erro?.message ?? erro}`);
                }
            }

            this.interpretador.pilhaEscoposExecucao.definirVariavel('lincones', moduloLincones);

            if (dados?.motor === 'delegua-entidades') {
                try {
                    const pacote = '@designliquido/delegua-entidades';
                    const modulo = await import(pacote);
                    this.classeContextoEntidades = modulo.ContextoEntidades;
                } catch {
                    console.warn('[Liquido] @designliquido/delegua-entidades não encontrado. Instale com: npm install @designliquido/delegua-entidades');
                }
            }
        }

        const diretorioEstatico = this.centroConfiguracoes?.liquido?.roteador?.diretorioEstatico || this.diretorioEstatico;
        const caminhoAbsolutoEstatico = caminho.join(this.diretorioBase, diretorioEstatico);
        this.roteador.configurarArquivosEstaticos(caminhoAbsolutoEstatico);

        const caminhoAbsolutoEstilos = caminho.join(this.diretorioBase, this.obterDiretorioBaseEstilos());
        if (caminhoAbsolutoEstilos !== caminhoAbsolutoEstatico) {
            this.roteador.configurarArquivosEstaticos(caminhoAbsolutoEstilos);
        }

        this.roteador.iniciarMiddlewares();
        await this.importarArquivosRotas();

        this.roteador.iniciar();

        if (this.centroConfiguracoes?.liquido?.arquetipo !== 'rest') {
            this.escreverEstilos();
        }
    }

    private configurarPipelineLinguagem(linguagem: string = 'delegua'): void {
        const linguagemNorm = this.normalizarLinguagem(linguagem);
        const lexador = linguagemNorm === 'delegua'
            ? new Lexador()
            : new LexadorPitugues();

        this.importador = new Importador(
            lexador,
            this.arquivosAbertos,
            this.conteudoArquivosAbertos,
            false
        );

        if (linguagemNorm === 'delegua') {
            this.interpretador = new InterpretadorLiquido(
                this.importador,
                process.cwd(),
                false,
                console.log
            );
            this.avaliadorSintatico = new AvaliadorSintaticoLiquido(
                this.importador
            );
        } else {
            this.interpretador = new InterpretadorLiquidoPitugues(
                this.importador,
                process.cwd(),
                false,
                console.log
            );
            this.avaliadorSintatico = new AvaliadorSintaticoLiquidoPitugues(
                this.importador
            );
        }

        this.avaliadorSintatico.tiposDeFerramentasExternas = {
            liquido: {
                lincones: 'módulo',
                liquido: 'módulo',
                requisicao: 'módulo',
                resposta: 'módulo',
                contexto: 'módulo'
            }
        };
    }

    /**
     * Método de importação do arquivo `configuracao.delprops`.
     * @returns void.
     */
    async importarArquivoConfiguracao(): Promise<void> {
        const caminhoConfigArquivo = this.resolverArquivoConfiguracao();

        if (caminhoConfigArquivo.valor === false) {
            console.info("Arquivo 'configuracao.delprops' não encontrado.");
            return;
        }

        try {
            if (!caminhoConfigArquivo.caminho) {
                return;
            }

            const retornoImportador = this.importador?.importar(caminhoConfigArquivo.caminho, -1);
            const retornoAvaliadorSintatico = await this.avaliadorSintatico?.analisar(
                retornoImportador?.retornoLexador as RetornoLexadorInterface<SimboloInterface<string>>,
                retornoImportador?.hashArquivo as number
            );

            if ((retornoAvaliadorSintatico?.erros || []).length > 0) {
                let mensagemCompleta = "";
                for (const erro of retornoAvaliadorSintatico?.erros || []) {
                    mensagemCompleta += `[Linha ${erro.linha}] Erro no arquivo de configuração: ${erro.message}\n`;
                }
                throw new Error(mensagemCompleta);
            }

            this.centroConfiguracoes = new CentroConfiguracoes(retornoAvaliadorSintatico?.declaracoes || []);

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
            if (arquivo === 'configuracao.delprops') {
                return { caminho: caminho.join(diretorioBase, arquivo), valor: true } as RetornoConfiguracaoInterface;
            }
        }

        return { caminho: null, valor: false } as RetornoConfiguracaoInterface;
    }

    private normalizarLinguagem(linguagem: string): string {
        return linguagem.normalize('NFD').replace(/[̀-ͯ]/g, '');
    }

    /**
     * Método de descoberta de rotas. Recursivo.
     * @param diretorio O diretório a ser pesquisado.
     */
    descobrirRotas(diretorio: string, linguagem: string): void {
        const linguagemNorm = this.normalizarLinguagem(linguagem);
        const listaDeRotas = sistemaDeArquivos.readdirSync(diretorio);

        const diretorioDescobertos: string[] = [];

        for (const diretorioOuArquivo of listaDeRotas) {
            const caminhoAbsoluto = caminho.join(diretorio, diretorioOuArquivo);

            if (linguagemNorm === 'delegua') {
                if (caminhoAbsoluto.endsWith('.delegua')) {
                    this.arquivosDelegua.push(caminhoAbsoluto);
                    continue;
                }
            }

            if (linguagemNorm === 'pitugues') {
                if (caminhoAbsoluto.endsWith('.pitu')) {
                    this.arquivosPitugues.push(caminhoAbsoluto);
                    continue;
                }
            }

            if (sistemaDeArquivos.lstatSync(caminhoAbsoluto).isDirectory()) {
                diretorioDescobertos.push(caminhoAbsoluto);
            }
        }

        for (const diretorioDescoberto of diretorioDescobertos) {
            this.descobrirRotas(diretorioDescoberto, linguagemNorm);
        }
    }

    descobrirEstilos(): string[] {
        try {
            const listaDeEstilos = sistemaDeArquivos.readdirSync('./estilos');

            const arquivosDescobertos: string[] = [];

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

    /**
     * Diretório onde o CSS gerado a partir de FolEs é escrito e a partir
     * do qual é servido pelo Express (`liquido.estilos.diretorioBase`, padrão: 'publico/css').
     */
    obterDiretorioBaseEstilos(): string {
        return this.centroConfiguracoes?.liquido?.estilos?.diretorioBase || 'publico/css';
    }

    escreverEstilos() {
        const arquivosEstilos = this.descobrirEstilos();
        const diretorioBaseEstilos = this.obterDiretorioBaseEstilos();

        if (!sistemaDeArquivos.existsSync(`./${diretorioBaseEstilos}`)) {
            sistemaDeArquivos.mkdirSync(`./${diretorioBaseEstilos}`, { recursive: true });
        }

        for (const arquivo of arquivosEstilos) {
            const teste = this.foles.converterParaCss(arquivo);
            const arquivoDestino = caminho.join(
                process.cwd(),
                `./${diretorioBaseEstilos}`,
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
    resolverCaminhoRota(caminhoArquivo: string, linguagem: string): string {
        const extensaoLinguagem = this.normalizarLinguagem(linguagem) === 'delegua'
            ? 'delegua'
            : 'pitu';

        const partesArquivo = caminhoArquivo.split('rotas');
        const rotaResolvida = partesArquivo[1]
            .replace(`inicial.${extensaoLinguagem}`, '')
            .replace(`.${extensaoLinguagem}`, '')
            .replace(new RegExp(`\\${caminho.sep}`, 'g'), '/')
            .replace(new RegExp(`/$`, 'g'), '')
            .replace(new RegExp(`\\[(.+)\\]`, 'g'), ':$1');

        return rotaResolvida === '' ? '/' : rotaResolvida;
    }

    async analisarArquivo(arquivo: string): Promise<Declaracao[] | null> {
        const retornoImportador = this.importador?.importar(arquivo, -1);

        const retornoAvaliadorSintatico = await (this
            .avaliadorSintatico as {
                analisar: (retornoLexador: RetornoLexadorInterface<SimboloInterface<string>>, hashArquivo: number) => Promise<{ erros: any[]; declaracoes: Declaracao[] }>
            })?.analisar(
                retornoImportador?.retornoLexador as RetornoLexadorInterface<SimboloInterface<string>>,
                retornoImportador?.hashArquivo as number
            );

        if (retornoAvaliadorSintatico?.erros.length > 0) {
            for (const erro of retornoAvaliadorSintatico?.erros || []) {
                console.error(
                    `[Linha ${erro.linha}] Erro na rota ${arquivo}: ${erro.message}`
                );
            }

            return null;
        }

        return retornoAvaliadorSintatico?.declaracoes || [];
    }

    private coletarFuncoesDaRota(
        declaracoes: Declaracao[]
    ): Map<string, FuncaoConstruto> {
        const funcaoDeclaracoes: Map<string, FuncaoConstruto> = new Map();

        for (const declaracao of declaracoes) {
            if (declaracao instanceof FuncaoDeclaracao) {
                funcaoDeclaracoes.set(declaracao.simbolo.lexema, declaracao.funcao);
            }
        }

        return funcaoDeclaracoes;
    }

    private resolverArgumentosDaRota(
        argumentos: any[],
        funcoesDeclaradas: Map<string, FuncaoConstruto>,
        arquivo: string
    ): FuncaoConstruto[] {
        const argumentosResolvidos: FuncaoConstruto[] = [];

        for (const argumento of argumentos) {
            if (argumento instanceof Variavel) {
                // Referência a função declarada
                const nomeFuncao = argumento.simbolo.lexema;

                if (funcoesDeclaradas.has(nomeFuncao)) {
                    const funcaoResolvida = funcoesDeclaradas.get(nomeFuncao);

                    if (funcaoResolvida) {
                        argumentosResolvidos.push(funcaoResolvida);
                    }
                } else {
                    console.error(`Função '${nomeFuncao}' referenciada mas não encontrada em ${arquivo}`);
                }
            } else if (argumento instanceof FuncaoConstruto) {
                // Função em linha/anônima
                argumentosResolvidos.push(argumento);
            } else {
                console.error(
                    `Argumento de rota inválido em ${arquivo}: esperado função ou referência a função`
                );
            }
        }

        return argumentosResolvidos;
    }

    private extrairChamadaLiquido(
        declaracao: any
    ): { nomeMetodo: string; argumentos: any[] } | null {
        const expressao = declaracao instanceof Expressao
            ? declaracao.expressao
            : null;

        if (!expressao) return null;
        if (expressao instanceof Chamada) {
            const expressaoChamada = expressao.entidadeChamada;
            if (expressaoChamada instanceof AcessoMetodo) {
                // Normalmente é o caso de uma chamada como `liquido.rotaGet(...)`
                const objeto = expressaoChamada.objeto as Variavel;
                if (!objeto.simbolo || objeto.simbolo.lexema.toLowerCase() !== 'liquido') {
                    return null;
                }

                return {
                    nomeMetodo: expressaoChamada.nomeMetodo,
                    argumentos: expressao.argumentos
                };
            }

            // Pituguês não converte para `AcessoMetodo`, então precisamos lidar com `AcessoMetodoOuPropriedade`.
            if (expressaoChamada instanceof AcessoMetodoOuPropriedade) {
                const objeto = expressaoChamada.objeto as Variavel;
                if (!objeto.simbolo || objeto.simbolo.lexema.toLowerCase() !== 'liquido') {
                    return null;
                }

                return {
                    nomeMetodo: expressaoChamada.simbolo.lexema,
                    argumentos: expressao.argumentos
                };
            }
        }

        return null;
    }

    async importarArquivosRotas(): Promise<void> {
        const metodosRotaPermitidos = new Set([
            'rotaGet',
            'rotaPost',
            'rotaPut',
            'rotaDelete',
            'rotaPatch',
            'rotaOptions',
            'rotaCopy',
            'rotaHead',
            'rotaLock',
            'rotaUnlock',
            'rotaPurge',
            'rotaPropfind'
        ]);

        const linguagemSelecionada = this.normalizarLinguagem(
            this.centroConfiguracoes?.liquido?.linguagem || 'delegua'
        );

        this.descobrirRotas(
            caminho.join(this.diretorioBase, 'rotas'),
            linguagemSelecionada
        );

        const arquivosParaLer = linguagemSelecionada === 'delegua'
            ? this.arquivosDelegua
            : this.arquivosPitugues;

        for (const arquivo of arquivosParaLer) {
            const declaracoes = await this.analisarArquivo(arquivo);
            if (!declaracoes) {
                console.error(`[Liquido] Arquivo de rota ignorado por erros de análise: ${arquivo}`);
                continue;
            }

            const funcaoDeclaracoes = this.coletarFuncoesDaRota(declaracoes);

            for (const declaracao of declaracoes) {
                const chamadaLiquido = this.extrairChamadaLiquido(declaracao);
                if (chamadaLiquido) {
                    const { nomeMetodo, argumentos } = chamadaLiquido;

                    if (metodosRotaPermitidos.has(nomeMetodo)) {
                        const argumentosResolvidos = this
                            .resolverArgumentosDaRota(
                                argumentos,
                                funcaoDeclaracoes,
                                arquivo
                            );

                        await this.adicionarRota(
                            nomeMetodo,
                            this.resolverCaminhoRota(
                                arquivo,
                                linguagemSelecionada
                            ),
                            argumentosResolvidos,
                            arquivo
                        );
                    }
                }
            }
        }
    }

    /**
     * Normaliza um objeto JavaScript simples que pode ter sido criado sem protótipo
     * (como `req.params`, `req.query` do Express, que usam `Object.create(null)`).
     * O interpretador Delégua depende de `constructor` para identificar objetos
     * como dicionários, então é necessário garantir que o protótipo padrão exista.
     */
    private normalizarObjetoJS(valor: any): any {
        if (
            valor !== null &&
            typeof valor === 'object' &&
            !Array.isArray(valor)
        ) {
            if (valor.constructor === undefined) {
                // Objeto criado sem protótipo (ex: Object.create(null)).
                // Cria uma cópia com protótipo padrão para que o interpretador
                // consiga acessar `constructor` e tratar o objeto como dicionário.
                return { ...valor };
            }

            // Já tem protótipo; mantém o original.
            return valor;
        }

        return valor;
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
        this.avaliadorSintatico?.pilhaEscopos.definirInformacoesVariavel('liquido', new InformacaoElementoSintatico('liquido', 'módulo'));
        this.avaliadorSintatico?.pilhaEscopos.definirInformacoesVariavel('requisicao', new InformacaoElementoSintatico('requisicao', 'módulo'));
        this.avaliadorSintatico?.pilhaEscopos.definirInformacoesVariavel('resposta', new InformacaoElementoSintatico('resposta', 'módulo'));

        const descritorClasseRequisicao = new Requisicao(requisicao);
        await descritorClasseRequisicao.chamar(this.interpretador as InterpretadorInterface, []);

        const instanciaRequisicao = new ObjetoDeleguaClasse(descritorClasseRequisicao);
        instanciaRequisicao.definir({ lexema: 'corpo' } as SimboloInterface, this.normalizarObjetoJS(requisicao.body));
        instanciaRequisicao.definir({ lexema: 'parametros' } as SimboloInterface, this.normalizarObjetoJS(requisicao.params));
        instanciaRequisicao.definir({ lexema: 'parametrosPesquisa' } as SimboloInterface, this.normalizarObjetoJS(requisicao.query || {}));
        instanciaRequisicao.definir({ lexema: 'parametrosCaminho' } as SimboloInterface, requisicao.path);

        this.interpretador?.pilhaEscoposExecucao.definirVariavel(
            'requisicao',
            instanciaRequisicao
        );

        const descritorClasseResposta = new Resposta();
        await descritorClasseResposta.chamar(this.interpretador as InterpretadorInterface, []);
        this.interpretador?.pilhaEscoposExecucao.definirVariavel(
            'resposta',
            new ObjetoDeleguaClasse(descritorClasseResposta)
        );

        if (this.classeContextoEntidades && this.provedorLincones.instancia) {
            const contexto = new this.classeContextoEntidades(this.provedorLincones.instancia);
            this.interpretador?.pilhaEscoposExecucao.definirVariavel('contexto', contexto);
        }

        const funcaoRetorno = new DeleguaFuncao(nomeFuncao, funcaoConstruto);
        this.interpretador?.pilhaEscoposExecucao.definirVariavel(nomeFuncao, funcaoRetorno);
    }

    /**
     * Chamada ao Interpretador Delégua com a estrutura declarativa para a
     * execução da função nomeada na rota.
     * @param nomeFuncao O nome da função da rota.
     * @returns O resultado da interpretação.
     */
    async chamarInterpretador(nomeFuncao: string): Promise<RetornoInterpretadorInterface> {
        try {
            return await this.interpretador?.interpretar(
                [
                    new Expressao(
                        new Chamada(-1, new Variavel(-1, new Simbolo('IDENTIFICADOR', nomeFuncao, null, -1, -1)), [
                            new Variavel(-1, new Simbolo('IDENTIFICADOR', 'requisicao', null, -1, -1)),
                            new Variavel(-1, new Simbolo('IDENTIFICADOR', 'resposta', null, -1, -1))
                        ])
                    )
                ],
                true
            ) || {
                erros: [],
                resultado: []
            } as RetornoInterpretadorInterface;
        } catch (erro: any) {
            console.error(erro);
            throw erro;
        }
    }

    private classificarErro(erro: ErroInterpretadorInterface): { codigo: string; mensagemAmigavel?: string } {
        const textoErro = (erro.mensagem || erro.erroInterno?.message || '').toLowerCase();

        for (const item of listaDeErros) {
            if (textoErro.includes(item.palavraChave)) {
                return { codigo: item.codigo, mensagemAmigavel: item.mensagem };
            }
        }

        return { codigo: 'LIQ99999' };
    }

    private logicaComumErrosInterpretacao(
        retornoInterpretador: RetornoInterpretadorInterface,
        arquivoFonte?: string
    ): {
        corpoRetorno?: any;
        statusHttp?: number;
        redirecionamento?: string;
        tipoConteudo?: string;
    } {
        const listaErros: string[] = [];

        for (const erro of retornoInterpretador.erros) {
            const { codigo, mensagemAmigavel } = this.classificarErro(erro);
            const localizacao = [
                arquivoFonte ? `Arquivo: ${arquivoFonte}` : undefined,
                erro.linha !== undefined && erro.linha > 0 ? `Linha: ${erro.linha}` : undefined
            ]
                .filter(Boolean)
                .join(', ');

            if (erro.erroInterno) {
                const erroInternoTipado: {
                    message: string;
                    pilha: string;
                } = erro.erroInterno;

                const mensagemPrincipal = mensagemAmigavel || erroInternoTipado.message;
                const detalheTecnico = mensagemAmigavel
                    ? ` (detalhe técnico: ${erroInternoTipado.message})`
                    : '';

                console.error(
                    `[Liquido] ${codigo}${localizacao ? ` [${localizacao}]` : ''}: ${mensagemPrincipal}${detalheTecnico}`
                );
                listaErros.push(
                    `
                    Código: ${codigo}\n
                    ${localizacao ? `Onde: ${localizacao}\n` : ''}
                    Mensagem: ${mensagemPrincipal}\n
                    ${mensagemAmigavel ? `Detalhe técnico: ${erroInternoTipado.message}\n` : ''}
                    Pilha: ${erroInternoTipado.pilha}
                    `
                );
            } else {
                const mensagemPrincipal = mensagemAmigavel || erro.mensagem;
                const detalheTecnico = mensagemAmigavel ? ` (detalhe técnico: ${erro.mensagem})` : '';
                const prefixoLocalizacao = localizacao ? ` [${localizacao}]` : ` - [Linha ${erro.linha}]`;

                console.error(`[Liquido] ${codigo}${prefixoLocalizacao}: ${mensagemPrincipal}${detalheTecnico}`);
                listaErros.push(
                    `${codigo}${prefixoLocalizacao}: ${mensagemPrincipal}${detalheTecnico}`
                );
            }
        }

        let corpoFinal: any;

        if (this.centroConfiguracoes.liquido.arquetipo === 'mvc') {
            const itensLista = listaErros
                .map(erro => `<li><pre>${erro}</pre></li>`)
                .join('');

            corpoFinal = `
                <!DOCTYPE html>
                <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Erro de Execução - Líquido</title>
                        <style>
                            :root {
                                --fundo: #f4f6f8;
                                --texto: #333;
                                --vermelho-topo: #dc3545;
                                --branco: #ffffff;
                                --borda: #e1e4e8;
                                --fundo-codigo: #2d2d2d;
                                --texto-codigo: #f8f8f2;
                            }

                            body {
                                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                                background-color: var(--fundo);
                                color: var(--texto);
                                margin: 0;
                                padding: 0;
                                line-height: 1.6;
                            }

                            .cabecalho-erro {
                                background-color: var(--vermelho-topo);
                                color: var(--branco);
                                padding: 40px 20px;
                                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                            }

                            .container {
                                max-width: 1000px;
                                margin: 0 auto;
                            }

                            h1 {
                                margin: 0;
                                font-size: 2.2rem;
                                font-weight: 600;
                            }

                            h2 {
                                color: var(--vermelho-topo);
                                border-bottom: 2px solid #ffcccc;
                                padding-bottom: 10px;
                                margin-top: 40px;
                                font-size: 1.5rem;
                            }

                            .conteudo {
                                padding: 20px;
                            }

                            ul.stack-trace {
                                list-style: none;
                                padding: 0;
                                margin: 0;
                                display: flex;
                                flex-direction: column;
                                gap: 15px;
                            }

                            ul.stack-trace li {
                                background: var(--branco);
                                border: 1px solid var(--borda);
                                border-radius: 8px;
                                padding: 20px;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                                overflow-x: auto;
                            }

                            pre {
                                background-color: var(--fundo-codigo);
                                color: var(--texto-codigo);
                                padding: 15px;
                                border-radius: 6px;
                                font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                                font-size: 14px;
                                margin: 0;
                                white-space: pre-wrap;
                                word-wrap: break-word;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="cabecalho-erro">
                            <div class="container">
                                <h1>Ocorreu um erro</h1>
                            </div>
                        </div>

                        <div class="container conteudo">
                            <h2>Pilha de Execução</h2>
                            <ul class="stack-trace">${itensLista}</ul>
                        </div>
                    </body>
                </html>
            `;
        }

        if (this.centroConfiguracoes.liquido.arquetipo === 'mvc') {
            return { corpoRetorno: corpoFinal, statusHttp: 500, tipoConteudo: 'HTML' };
        }

        // Arquétipo 'rest' e qualquer outro valor: resposta estruturada em JSON.
        // Sem `tipoConteudo`, o corpo (um objeto) era coagido para texto e o
        // cliente recebia o literal "[object Object]" com text/plain.
        if (corpoFinal === undefined) {
            corpoFinal = {
                mensagem: 'Ocorreu um erro interno na aplicação.',
                detalhes: listaErros
            };
        }

        return { corpoRetorno: corpoFinal, statusHttp: 500, tipoConteudo: 'JSON' };
    }

    /**
     * Lógica para processamento da resposta como uma visão LMHT.
     * @param caminhoRota O caminho da rota da requisição.
     * @param statusHttp O status HTTP pré-calculado.
     * @param propriedades Propriedades da resposta, usadas para escolher a visão e parametrizá-la.
     * @returns Um objeto com o corpo do retorno e o status HTTP correspondente.
     */
    private async logicaComumRespostaVisaoLmht(
        caminhoRota: string,
        statusHttp: number,
        propriedades: {[nome: string]: any}
    ): Promise<CorpoResposta> {
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
            return { corpoRetorno: 'Erro ao processar visualizacao LMHT.', statusHttp: 500 };
        }
    }

    private obterObjetoRespostaDoEscopo(): ObjetoDeleguaClasse | null {
        try {
            const variavel = this.interpretador?.pilhaEscoposExecucao.obterVariavelPorNome('resposta');
            if (!variavel?.valor) return null;
            const valor = variavel.valor;
            if (valor instanceof ObjetoDeleguaClasse) return valor;
            if (valor?.valor instanceof ObjetoDeleguaClasse) return valor.valor;
        } catch {
            // resposta não encontrada no escopo
        }
        return null;
    }

    private async processarPropriedadesResposta(
        caminhoRota: string,
        objetoResposta: ObjetoDeleguaClasse
    ): Promise<CorpoResposta> {
        if (!objetoResposta?.propriedades) {
            return {};
        }

        let statusHttp: number = 200;
        if (objetoResposta.propriedades.statusHttp) {
            statusHttp = objetoResposta.propriedades.statusHttp;
        }

        if (objetoResposta.propriedades.destino) {
            return { redirecionamento: objetoResposta.propriedades.destino };
        }

        if (objetoResposta.propriedades.lmht) {
            const resultadoVisao = await this.logicaComumRespostaVisaoLmht(caminhoRota, statusHttp, objetoResposta.propriedades);
            resultadoVisao.tipoConteudo = 'HTML';
            return resultadoVisao;
        }

        if (objetoResposta.propriedades.respostaJson) {
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
            return { corpoRetorno: objetoResposta.propriedades.mensagem, tipoConteudo: 'TEXTO', statusHttp: statusHttp };
        }

        return statusHttp !== 200 ? { statusHttp: statusHttp } : {};
    }

    private async logicaComumResultadoInterpretador(
        caminhoRota: string,
        retornoInterpretador: RetornoInterpretadorInterface,
        arquivoFonte?: string
    ): Promise<CorpoResposta> {
        if (retornoInterpretador.erros.length > 0) {
            return this.logicaComumErrosInterpretacao(retornoInterpretador, arquivoFonte);
        }

        let objetoResposta: ObjetoDeleguaClasse | null = null;

        // Tenta obter resposta a partir do valor retornado pela função
        if (retornoInterpretador.resultado && retornoInterpretador.resultado.length > 0) {
            const representacaoObjeto = retornoInterpretador.resultado.pop() as ResultadoParcialInterpretadorInterface;
            const valorRetornado: RetornoQuebra = representacaoObjeto?.valorRetornado;

            if (valorRetornado?.valor) {
                const informacoesObjeto: VariavelInterface | any = valorRetornado.valor;
                const candidato = informacoesObjeto?.hasOwnProperty('valor')
                    ? informacoesObjeto.valor
                    : informacoesObjeto;

                if (candidato?.propriedades) {
                    objetoResposta = candidato;
                }
            }
        }

        // Fallback: lê o objeto `resposta` do escopo do interpretador.
        // Necessário quando a função de rota não usa `retorna` explicitamente
        // mas chama métodos como `resposta.json(...)` como efeito colateral.
        if (!objetoResposta) {
            objetoResposta = this.obterObjetoRespostaDoEscopo();
        }

        if (!objetoResposta) {
            return {};
        }

        return this.processarPropriedadesResposta(caminhoRota, objetoResposta);
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
     * @param arquivoFonte O caminho do arquivo fonte que define a rota, usado
     *                     para apontar a origem em mensagens de erro.
     * @returns O corpo e status da resposta, se houver.
     */
    private async executarFuncaoRota(
        req: any,
        caminhoRota: string,
        funcao: FuncaoConstruto,
        nomeFuncao: string,
        arquivoFonte?: string
    ): Promise<CorpoResposta> {
        await this.prepararRequisicao(req, nomeFuncao, funcao);
        const retornoInterpretador = await this.chamarInterpretador(nomeFuncao);
        return await this.logicaComumResultadoInterpretador(caminhoRota, retornoInterpretador, arquivoFonte);
    }

    /**
     * Configuração de uma rota no roteador Express.
     * @param metodoRoteador O método da rota.
     * @param caminhoRota O caminho completo do arquivo que define a rota.
     * @param argumentos Todas as funções em Delégua que devem ser executadas
     *                   para a resolução da rota. O último argumento é o handler final,
     *                   todos os anteriores são middlewares executados em sequência.
     * @param arquivoFonte O caminho do arquivo fonte que define a rota, usado
     *                     para apontar a origem em mensagens de erro.
     */
    async adicionarRota(
        metodoRoteador: string,
        caminhoRota: string,
        argumentos: FuncaoConstruto[],
        arquivoFonte?: string
    ): Promise<void> {
        if (argumentos.length === 0) {
            console.error(`Rota ${caminhoRota} não possui nenhuma função definida.`);
            return;
        }

        // Caminho relativo à raiz do projeto, mais legível em mensagens de erro.
        const arquivoFonteRelativo = arquivoFonte
            ? caminho.relative(process.cwd(), arquivoFonte)
            : undefined;

        // Separa middlewares (todos menos o último) e handler (último argumento)
        const middlewares = argumentos.slice(0, -1);
        const handler = argumentos[argumentos.length - 1];
        const chaveMetodo = metodoRoteador.replace('rota', '') as keyof typeof MetodoRoteador;
        const metodoResolvido = MetodoRoteador[chaveMetodo];
        const registradorRota = this.roteador.mapaRotas[metodoResolvido];

        if (!metodoResolvido || !registradorRota) {
            console.error(`Metodo de rota '${metodoRoteador}' nao suportado.`);
            return;
        }

        const linguagemSelecionada = this.normalizarLinguagem(
            this.centroConfiguracoes.liquido.linguagem || 'delegua'
        );
        if (linguagemSelecionada === 'delegua') {
            this.rotasDelegua.push(caminhoRota);
        } else {
            this.rotasPitugues.push(caminhoRota);
        }

        registradorRota(caminhoRota, async (req, res) => {
            const inicioRequisicao = process.hrtime.bigint();
            const duracaoMs = () => (Number(process.hrtime.bigint() - inicioRequisicao) / 1e6).toFixed(3);

            let corpoEStatus: CorpoResposta = {};

            // Executa middlewares em sequência
            for (let i = 0; i < middlewares.length; i++) {
                const middleware = middlewares[i];
                const nomeMiddleware = `middleware${i}_${metodoRoteador}`;

                corpoEStatus = await this.executarFuncaoRota(req, caminhoRota, middleware, nomeMiddleware, arquivoFonteRelativo);

                // Se o middleware enviou uma resposta, para a execução
                if (this.respostaFoiDefinida(corpoEStatus)) {
                    break;
                }
            }

            // Se nenhum middleware enviou resposta, executa o handler final
            if (!this.respostaFoiDefinida(corpoEStatus)) {
                corpoEStatus = await this.executarFuncaoRota(req, caminhoRota, handler, `handler_${metodoRoteador}`, arquivoFonteRelativo);
            }

            // Envia a resposta
            if (corpoEStatus.redirecionamento) {
                res.redirect(corpoEStatus.redirecionamento);
                console.log(`[Liquido] ${req.method} ${req.path} → redirecionado para ${corpoEStatus.redirecionamento} (${duracaoMs()} ms)`);
            } else if (corpoEStatus.statusHttp === 204) {
                res.status(204).end();
                console.log(`[Liquido] ${req.method} ${req.path} → aceito (204) (${duracaoMs()} ms)`);
            } else {
                const statusResposta = corpoEStatus.statusHttp ?? 200;
                if (corpoEStatus.tipoConteudo === 'JSON') {
                    res.status(statusResposta).json(corpoEStatus.corpoRetorno);
                } else if (corpoEStatus.tipoConteudo === 'HTML') {
                    res.status(statusResposta).type('text/html').send(corpoEStatus.corpoRetorno);
                } else {
                    const corpo = corpoEStatus.corpoRetorno;
                    const corpoString = typeof corpo === 'string' ? corpo : String(corpo ?? '');
                    if (/^\s*<\?xml/.test(corpoString)) {
                        res.status(statusResposta).type('application/xml').send(corpoString);
                    } else {
                        res.status(statusResposta).type('text/plain').send(corpoString);
                    }
                }
                if (statusResposta >= 500) {
                    console.error(`[Liquido] ${req.method} ${req.path} → rejeitado (${statusResposta}) (${duracaoMs()} ms)`);
                } else {
                    console.log(`[Liquido] ${req.method} ${req.path} → aceito (${statusResposta}) (${duracaoMs()} ms)`);
                }
            }
        });

        if (this.centroConfiguracoes?.liquido?.verboso) {
            console.log(`[Liquido] Rota registrada: ${metodoResolvido.toUpperCase()} ${caminhoRota}`);
        }
    }

    private limparObjeto(item: any): any {
        if (item === null || item === undefined || typeof item !== 'object') {
            return item;
        }

        if (item instanceof ReferenciaMontao) {
            try {
                return this.limparObjeto(this.interpretador?.resolverValor(item));
            } catch {
                // Bug em Delégua: classes estrangeiras podem criar ReferenciaMontao
                // sem armazenar o valor no montão. Tenta acesso direto como fallback.
                const valorDireto = (this.interpretador as any)?.montao?.referencias?.[item.endereco];
                return valorDireto !== undefined ? this.limparObjeto(valorDireto) : null;
            }
        }

        if (Array.isArray(item)) {
            return item.map((i) => this.limparObjeto(i));
        }

        if ('valor' in item && item.valor !== undefined) {
            return this.limparObjeto(item.valor);
        }

        if ('propriedades' in item && item.propriedades) {
            const novoObjeto: {[chave: string]: any} = {};
            const propriedades = item.propriedades;

            for (const [chave, valorProp] of Object.entries(propriedades)) {
                novoObjeto[chave] = this.limparObjeto(valorProp);
            }

            return novoObjeto;
        }

        return item;
    }
}
