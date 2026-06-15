import * as sistemaDeArquivos from 'fs';
import * as caminho from 'path';

import { AvaliadorSintaticoLiquido, AvaliadorSintaticoLiquidoPitugues } from './infraestrutura/avaliadores-sintaticos';
import { AcessoMetodo, Chamada, FuncaoConstruto, Variavel } from '@designliquido/delegua/construtos';
import { Expressao, FuncaoDeclaracao } from '@designliquido/delegua/declaracoes'
import { DeleguaFuncao, ObjetoDeleguaClasse } from '@designliquido/delegua/interpretador/estruturas';
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
            if (dados?.autoInicializar) {
                try {
                    if (dados.motor === 'delegua-entidades') {
                        await inicializarBancoDeleguaEntidades(
                            dados.lincones?.tecnologia ?? '',
                            dados.lincones?.caminho ?? '',
                            false,
                            false,
                            this.provedorLincones.instancia
                        );
                    } else {
                        await inicializarBancoLincones(
                            dados.lincones?.tecnologia ?? '',
                            dados.lincones?.caminho ?? '',
                            dados.arquivoInicializacao,
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

        this.roteador.configurarArquivosEstaticos(this.diretorioEstatico);
        this.roteador.iniciarMiddlewares();
        await this.importarArquivosRotas();

        this.roteador.iniciar();

        if (this.centroConfiguracoes?.liquido?.arquetipo !== 'rest') {
            this.escreverEstilos();
        }
    }

    private configurarPipelineLinguagem(linguagem: string = 'delegua'): void {
        const lexador = linguagem === 'delegua'
            ? new Lexador()
            : new LexadorPitugues();

        this.importador = new Importador(
            lexador,
            this.arquivosAbertos,
            this.conteudoArquivosAbertos,
            false
        );

        if (linguagem === 'delegua') {
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

    /**
     * Método de descoberta de rotas. Recursivo.
     * @param diretorio O diretório a ser pesquisado.
     */
    descobrirRotas(diretorio: string, linguagem: string): void {
        const listaDeRotas = sistemaDeArquivos.readdirSync(diretorio);

        const diretorioDescobertos: string[] = [];

        listaDeRotas.forEach((diretorioOuArquivo) => {
            const caminhoAbsoluto = caminho.join(diretorio, diretorioOuArquivo);

            if (linguagem === 'delegua') {
                if (caminhoAbsoluto.endsWith('.delegua')) {
                    this.arquivosDelegua.push(caminhoAbsoluto);
                    return;
                }
            } else if (linguagem === 'pitugues') {
                if (caminhoAbsoluto.endsWith('.pitu')) {
                    this.arquivosPitugues.push(caminhoAbsoluto);
                    return;
                }
            }

            if (sistemaDeArquivos.lstatSync(caminhoAbsoluto).isDirectory()) {
                diretorioDescobertos.push(caminhoAbsoluto);
            }
        });

        diretorioDescobertos.forEach((diretorioDescoberto) => {
            this.descobrirRotas(diretorioDescoberto, linguagem);
        });
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
    resolverCaminhoRota(caminhoArquivo: string, linguagem: string): string {
        const extensaoLinguagem = linguagem === 'delegua'
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
                // Função inline/anônima
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

        if (
            expressao instanceof Chamada &&
            expressao.entidadeChamada instanceof AcessoMetodo &&
            expressao.entidadeChamada.objeto instanceof Variavel &&
            expressao.entidadeChamada.objeto.simbolo.lexema.toLowerCase() === 'liquido'
        ) {
            return {
                nomeMetodo: expressao.entidadeChamada.nomeMetodo,
                argumentos: expressao.argumentos
            };
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

        const linguagemSelecionada = this
            .centroConfiguracoes?.liquido?.linguagem || 'delegua';

        this.descobrirRotas(
            caminho.join(this.diretorioBase, 'rotas'),
            linguagemSelecionada
        );

        const arquivosParaLer = linguagemSelecionada === 'delegua'
            ? this.arquivosDelegua
            : this.arquivosPitugues;

        for (const arquivo of arquivosParaLer) {
            const declaracoes = await this.analisarArquivo(arquivo);
            if (!declaracoes) continue;

            // Primeiro passo: coletar todas as declarações de funções (middlewares/handlers)
            const funcaoDeclaracoes = this.coletarFuncoesDaRota(declaracoes);

            // Segundo passo: processar registros de rotas e resolver referências a funções
            for (const declaracao of declaracoes) {
                // Decoradores em Funções (@liquido.rotaGet)
                if (
                    declaracao instanceof FuncaoDeclaracao && declaracao.decoradores?.length > 0
                ) {
                    for (const decorador of declaracao.decoradores) {
                        const nomeDecorador = decorador.nome.toLowerCase();

                        if (nomeDecorador.startsWith('liquido.rota')) {
                            const partes = decorador.nome.split('.');
                            const nomeMetodo = partes[partes.length - 1];

                            if (metodosRotaPermitidos.has(nomeMetodo)) {
                                await this.adicionarRota(
                                    nomeMetodo,
                                    this.resolverCaminhoRota(
                                        arquivo,
                                        linguagemSelecionada
                                    ),
                                    [declaracao.funcao]
                                );
                            }
                        }
                    }
                }

                // Ignora declarações que não são expressões (ex: Funcao para middlewares)
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
                            argumentosResolvidos
                        );
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
        this.avaliadorSintatico?.pilhaEscopos.definirInformacoesVariavel('liquido', new InformacaoElementoSintatico('liquido', 'módulo'));
        this.avaliadorSintatico?.pilhaEscopos.definirInformacoesVariavel('requisicao', new InformacaoElementoSintatico('requisicao', 'módulo'));
        this.avaliadorSintatico?.pilhaEscopos.definirInformacoesVariavel('resposta', new InformacaoElementoSintatico('resposta', 'módulo'));
        const descritorClasseRequisicao = new Requisicao(requisicao);
        await descritorClasseRequisicao.chamar(this.interpretador as InterpretadorInterface, []);
        const instanciaRequisicao = new ObjetoDeleguaClasse(descritorClasseRequisicao);
        instanciaRequisicao.definir({ lexema: 'corpo' } as SimboloInterface, requisicao.body);
        instanciaRequisicao.definir({ lexema: 'parametros' } as SimboloInterface, requisicao.params);
        instanciaRequisicao.definir({ lexema: 'parametrosPesquisa' } as SimboloInterface, requisicao.query || {});
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

    private classificarErro(erro: ErroInterpretadorInterface): string {
        const textoErro = (erro.mensagem || erro.erroInterno?.message || '').toLowerCase();

        for (const item of listaDeErros) {
            if (textoErro.includes(item.palavraChave)) {
                return item.codigo;
            }
        }

        return 'LIQ99999';
    }

    private logicaComumErrosInterpretacao(
        retornoInterpretador: RetornoInterpretadorInterface
    ): {
        corpoRetorno?: any;
        statusHttp?: number;
        redirecionamento?: string;
    } {
        const listaErros: string[] = [];

        for (const erro of retornoInterpretador.erros) {
            const tipoErro = this.classificarErro(erro);

            if (erro.erroInterno) {
                const erroInternoTipado: {
                    message: string;
                    pilha: string;
                } = erro.erroInterno;

                listaErros.push(
                    `
                    Código: ${tipoErro}\n
                    Mensagem: ${erroInternoTipado.message}\n
                    Pilha: ${erroInternoTipado.pilha}
                    `
                );
            } else {
                listaErros.push(
                    `${tipoErro} - [Linha ${erro.linha}]: ${erro.mensagem}`
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

        if (this.centroConfiguracoes.liquido.arquetipo === 'rest') {
            corpoFinal = {
                mensagem: 'Ocorreu um erro interno na aplicação.',
                detalhes: listaErros
            };
        }

        return { corpoRetorno: corpoFinal, statusHttp: 500 };
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
    async adicionarRota(
        metodoRoteador: string,
        caminhoRota: string,
        argumentos: FuncaoConstruto[]
    ): Promise<void> {
        if (argumentos.length === 0) {
            console.error(`Rota ${caminhoRota} não possui nenhuma função definida.`);
            return;
        }

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

        const linguagemSelecionada = this.centroConfiguracoes.liquido.linguagem || 'delegua';
        if (linguagemSelecionada === 'delegua') {
            this.rotasDelegua.push(caminhoRota);
        } else {
            this.rotasPitugues.push(caminhoRota);
        }

        registradorRota(caminhoRota, async (req, res) => {
            let corpoEStatus: CorpoResposta = {};

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
                const statusResposta = corpoEStatus.statusHttp ?? 200;
                res.status(statusResposta).send(corpoEStatus.corpoRetorno);
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
