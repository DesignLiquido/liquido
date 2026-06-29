import { textSync } from 'figlet'
import { Classe } from '@designliquido/delegua/declaracoes';
import { pluralizar } from '@designliquido/flexoes';
import {
    blue,
    green,
    red,
    yellow
} from "chalk";
import yargs from 'yargs'
import prompts from 'prompts';
import { spawn } from 'child_process';
import { argv, cwd, env, execPath } from 'process';
import path from 'path';
import fs from 'fs';

import { Liquido } from './liquido';
import {
    copiarArquivosDeExemploParaNovoProjeto,
    criarDiretorioAplicacao,
    criarDiretorioSeNaoExiste,
    detectarGerenciadorDePacotes,
    documentar,
    gerarRepositorioGit,
    importarModelos,
    inicializarBancoDeleguaEntidades,
    inicializarBancoLincones,
    lerMotorConfigurado,
    obterTodosModelos
} from './interface-linha-comando';
import { ComandoBancoIniciarInterface, ComandoGerarInterface, ComandoNovoInterface } from './interfaces';
import { GeradorVisoes } from './interface-linha-comando/gerar/gerador-visoes';
import { GeradorRotas } from './interface-linha-comando/gerar/gerador-rotas';
import { GeradorInicializacaoLincones } from './interface-linha-comando/gerar/gerador-inicializacao-lincones';

/**
 * Classe que representa o ponto de entrada da aplicação Liquido.
 */
class LiquidoPontoEntrada {
    logo: string

    constructor() {
        this.logo = textSync('Liquido', { horizontalLayout: 'full' })
    }

    mostrarLogo() {
    if (process.env.LIQUIDO_OBSERVANDO === '1') {
        return;
    }
        console.log(blue(this.logo + '\n'))
    }

    async comandoDocumentar() {
        // await encontrarControladores();
        await documentar();
    }

    async comandoGerar(
        args: yargs.ArgumentsCamelCase<ComandoGerarInterface>
    ) {
        let nomeModelo = args.modelo

        if (nomeModelo === undefined || nomeModelo.length <= 0) {
            const opcoesModelos = obterTodosModelos()

            const respostaNomeModelo = await prompts({
                type: 'select',
                name: 'nomeModelo',
                message: 'Qual o nome do modelo?',
                choices: opcoesModelos
            });

            nomeModelo = respostaNomeModelo.nomeModelo;
        }

        const declaracoes = await importarModelos(nomeModelo);
        criarDiretorioAplicacao('rotas');

        const motor = lerMotorConfigurado();
        const geradorVisoes = new GeradorVisoes();
        const geradorRotas = new GeradorRotas(motor);

        let geradorInicializacao: GeradorInicializacaoLincones | null = null;
        let caminhoArquivoInicializacao: string | null = null;

        if (motor === 'lincones') {
            const liquido = new Liquido(process.cwd());
            await liquido.importarArquivoConfiguracao();
            const arquivoInicializacao =
                liquido.centroConfiguracoes?.liquido?.dados?.lincones?.arquivoInicializacao
                ?? 'inicializacao.lincones';
            caminhoArquivoInicializacao = path.join(process.cwd(), arquivoInicializacao);
            geradorInicializacao = new GeradorInicializacaoLincones();
        }

        for (const declaracao of declaracoes) {
            const declaracaoModelo = <Classe>declaracao
            const nomeBaseModelo = declaracaoModelo.simbolo.lexema.toLocaleLowerCase('pt');
            const nomeModeloPlural = pluralizar(nomeBaseModelo).toLocaleLowerCase('pt');

            const caminhosRotas: string[] = geradorRotas.criarNovasRotas(declaracaoModelo);
            for (const caminhoRota of caminhosRotas) {
                console.info(blue(`Rota ${caminhoRota}`));
            }

            criarDiretorioSeNaoExiste('visoes', nomeModeloPlural);

            const visaoSelecionarTudo = geradorVisoes.criarNovaVisao(nomeModeloPlural, declaracaoModelo, 'selecionarTudo');
            console.info(blue(`Visão ${visaoSelecionarTudo}`));
            const visaoSelecionarUm = geradorVisoes.criarNovaVisao(nomeModeloPlural, declaracaoModelo, 'selecionarUm');
            console.info(blue(`Visão ${visaoSelecionarUm}`));
            const visaoAdicionar = geradorVisoes.criarNovaVisao(nomeModeloPlural, declaracaoModelo, 'adicionar');
            console.info(blue(`Visão ${visaoAdicionar}`));
            const visaoEditar = geradorVisoes.criarNovaVisao(nomeModeloPlural, declaracaoModelo, 'editar');
            console.info(blue(`Visão ${visaoEditar}`));
            const visaoExcluir = geradorVisoes.criarNovaVisao(nomeModeloPlural, declaracaoModelo, 'excluir');
            console.info(blue(`Visão ${visaoExcluir}`));

            if (geradorInicializacao && caminhoArquivoInicializacao) {
                geradorInicializacao.acrescentarCriarTabela(declaracaoModelo, caminhoArquivoInicializacao);
                console.info(blue(`Inicialização ${caminhoArquivoInicializacao}`));
            }
        }
    }

    async comandoNovo(
        args: yargs.ArgumentsCamelCase<ComandoNovoInterface>
    ) {
        let nomeProjeto = args.nome

        if (nomeProjeto === undefined || nomeProjeto.length <= 0) {
            const respostaNomeProjeto = await prompts({
                type: 'text',
                name: 'nomeProjeto',
                message: 'Qual o nome do seu projeto?'
            });

            nomeProjeto = respostaNomeProjeto.nomeProjeto;
        }

        if (nomeProjeto.length > 0) {
            const diretorioAlvo = nomeProjeto;

            if (nomeProjeto === '.' || nomeProjeto === './') {
                nomeProjeto = path.basename(cwd());
            }

            console.log(green(`Iremos criar um novo projeto em Liquido chamado "${nomeProjeto}"`));

            const resposta = await prompts({
                type: 'confirm',
                message: 'Confirma?',
                name: 'confirmado',
                initial: true,
                onRender(this: any) {
                    this.yesMsg = 'Sim';
                    this.noMsg = 'não';
                    this.yesOption = '(S/n)';
                }
            });

            if (resposta.confirmado) {
                const diretorioCompleto = criarDiretorioAplicacao(
                    diretorioAlvo
                );

                const perguntaTipoProjeto = await prompts({
                    type: 'select',
                    name: 'tipoProjeto',
                    message: 'Selecione o tipo de projeto',
                    choices: [
                        { title: 'MVC', description: 'Modelo-Visão-Controlador', value: 'mvc' },
                        { title: 'API REST', description: 'Interface de dados usando o modelo REST', value: 'api-rest' }
                    ],
                    initial: 1
                });

                const perguntaLinguagemDeBackEnd = await prompts({
                    type: 'select',
                    name: 'linguagemBackEnd',
                    message: 'Selecione a linguagem de programação',
                    choices: [
                        {
                            title: 'Delégua',
                            value: 'delegua'
                        },
                        {
                            title: 'Pituguês',
                            value: 'pitugues'
                        }
                    ],
                    initial: 1
                });

                const perguntaInicializarRepositorioGit = await prompts({
                    type: 'confirm',
                    message: 'Deseja inicializar um repositório Git?',
                    name: 'confirmado',
                    initial: true,
                    onRender(this: any) {
                        this.yesMsg = 'Sim';
                        this.noMsg = 'não';
                        this.yesOption = '(S/n)';
                    }
                });
                const inicializarRepositorioGit =
                    perguntaInicializarRepositorioGit.confirmado;

                const perguntaQualGerenciadorDePacotesQuerUsar = await prompts({
                    type: 'select',
                    name: 'gerenciadorDePacotes',
                    message: 'Selecione o gerenciador de pacotes que você deseja utilizar',
                    choices: [
                        { title: 'NPM', value: 'npm' },
                        { title: 'Yarn', value: 'yarn' },
                        { title: 'Bun', value: 'bun' }
                    ],
                    initial: 1
                });
                const gerenciadorDePacotes =
                    perguntaQualGerenciadorDePacotesQuerUsar.gerenciadorDePacotes;

                const linguagemSelecionada = perguntaLinguagemDeBackEnd.linguagemBackEnd;

                await detectarGerenciadorDePacotes(
                    gerenciadorDePacotes,
                    diretorioCompleto
                );

                await copiarArquivosDeExemploParaNovoProjeto(
                    nomeProjeto,
                    perguntaTipoProjeto.tipoProjeto,
                    linguagemSelecionada,
                    diretorioCompleto
                );

                await gerarRepositorioGit(
                    inicializarRepositorioGit,
                    diretorioCompleto
                );

                console.info(yellow(`Seu projeto foi criado com sucesso! ${diretorioCompleto}`))
            }
        }
    }

    async comandoBancoIniciar(
        args: yargs.ArgumentsCamelCase<ComandoBancoIniciarInterface>
    ) {
        const liquido = new Liquido(process.cwd());
        await liquido.importarArquivoConfiguracao();

        const dados = liquido.centroConfiguracoes?.liquido?.dados;
        const motor = dados?.motor ?? 'lincones';
        const tecnologia = dados?.lincones?.tecnologia;
        const caminhoBanco = dados?.lincones?.caminho;

        if (!tecnologia || !caminhoBanco) {
            console.error(red('Configuração de banco de dados não encontrada em configuracao.delprops.'));
            console.error(red('Adicione liquido.dados.lincones.tecnologia e liquido.dados.lincones.caminho'));
            process.exit(1);
            return;
        }

        try {
            if (motor === 'delegua-entidades') {
                await inicializarBancoDeleguaEntidades(
                    tecnologia,
                    caminhoBanco,
                    args.apenasEstrutura,
                    args.apenasDados
                );
            } else {
                await inicializarBancoLincones(
                    tecnologia,
                    caminhoBanco,
                    args.arquivo,
                    args.apenasEstrutura,
                    args.apenasDados
                );
            }
        } catch (erro: any) {
            console.error(red(`Erro na inicialização do banco: ${erro?.message ?? erro}`));
            process.exit(1);
        }
    }

    private resolverCaminhosObservados(): string[] {
        return ['rotas', 'visoes', 'estilos']
            .map((diretorio) => path.join(process.cwd(), diretorio))
            .filter((diretorio) => fs.existsSync(diretorio));
    }

    private iniciarServidorComObservacao(): void {
        const caminhosObservados = this.resolverCaminhosObservados();

        if (caminhosObservados.length === 0) {
            console.warn(yellow('Nenhum diretório de rotas, visões ou estilos encontrado para observar.'));
        }

        const argumentos = [
            '--watch',
            ...caminhosObservados.map((diretorio) => `--watch-path=${diretorio}`),
            argv[1],
            ...argv.slice(2)
        ];

        console.info(blue('Observando mudanças em rotas, visões e estilos...'));

        const processo = spawn(execPath, argumentos, {
            stdio: 'inherit',
            env: {
                ...env,
                LIQUIDO_OBSERVANDO: '1'
            }
        });

        processo.on('exit', (codigo) => {
            process.exit(codigo ?? 0);
        });
    }

    comandoServidor() {
        if (env.LIQUIDO_OBSERVANDO !== '1') {
            this.iniciarServidorComObservacao();
            return;
        }

        const liquido = new Liquido(process.cwd());
        liquido.iniciar();
    }

    opcoes() {
        return yargs
        .scriptName('liquido')
        .version(false)
        .option('versao', { type: 'boolean', description: 'Exibe a versão do Líquido.' })
        .middleware((argv: any) => {
            if (argv.versao) {
                const pkgPath = fs.existsSync(path.join(__dirname, 'package.json'))
                    ? path.join(__dirname, 'package.json')
                    : path.join(__dirname, '..', 'package.json');
                console.log(require(pkgPath).version);
                process.exit(0);
            }
        })
        .usage('Uso: $0 <comando> [opções]')
        .help('ajuda')
        .alias('ajuda', '?')
        .command(['*', 'servidor'], 'Serve o diretório local como uma aplicação para a internet.', {}, this.comandoServidor.bind(this))
        .command('documentar', 'Lê o projeto e gera uma documentação OpenAPI correspondente', {}, this.comandoDocumentar)
        .command('novo [nome]', 'Inicia uma nova aplicação pré-configurada para funcionar com Liquido.', { nome: { type: 'string' as const, default: '' } }, this.comandoNovo)
        .command('gerar [modelo]', 'Gera controlador e visão correspondentes ao nome do modelo passado por parâmetro. O modelo deve ter um arquivo .delegua correspondente no diretório "modelos".', { modelo: { type: 'string' as const, default: '' } }, this.comandoGerar)
        .command(
            'banco iniciar',
            'Inicializa a estrutura e dados do banco de dados a partir de um script LinConEs ou de migrações e sementes do delegua-entidades.',
            {
                arquivo: { type: 'string' as const, default: 'inicializacao.lincones', describe: 'Arquivo de script LinConEs a executar (padrão: inicializacao.lincones)' },
                'apenas-estrutura': { type: 'boolean' as const, default: false, describe: 'Executa apenas enunciados DDL (estrutura)' },
                'apenas-dados': { type: 'boolean' as const, default: false, describe: 'Executa apenas enunciados DML (dados)' }
            },
            this.comandoBancoIniciar.bind(this)
        )
        .argv
    }

    async iniciar() {
        this.mostrarLogo()
        this.opcoes()
    }
}

(async () => new LiquidoPontoEntrada().iniciar())()
