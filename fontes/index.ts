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
    obterTodosModelos,
    validarTipoProjeto,
    validarLinguagem,
    validarGerenciadorDePacotes
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
        let nomeModelo = args.modelo;

        if (nomeModelo === undefined || nomeModelo.length <= 0) {
            const opcoesModelos = obterTodosModelos()

            if (opcoesModelos.length === 0) {
                console.error(red(
                    'Erro: Nenhum modelo encontrado.\n' +
                    'Certifique-se de que o diretório "modelos/" existe e contém arquivos .delegua.'
                ));
                process.exit(1);
            }

            const respostaNomeModelo = await prompts({
                type: 'select',
                name: 'nomeModelo',
                message: 'Qual o nome do modelo?',
                choices: opcoesModelos,
                hint: '- Use as setas. Enter para confirmar.'
            });

            nomeModelo = respostaNomeModelo.nomeModelo;
        }

        if (!nomeModelo) {
            console.error(red(
                'Erro: Nome do modelo não informado.\n' +
                'Uso: liquido gerar [modelo]'
            ));
            process.exit(1);
        }

        const caminhoModelo = path.join(process.cwd(), 'modelos', `${nomeModelo}.delegua`);
        if (!fs.existsSync(caminhoModelo)) {
            console.error(red(
                `Erro: Arquivo de modelo não encontrado: ${caminhoModelo}`
            ));
            process.exit(1);
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
            const declaracaoModelo = declaracao as Classe
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
        const modoInterativo = process.stdin.isTTY;

        let nomeProjeto = args.nome;

        if (nomeProjeto === undefined || nomeProjeto.length <= 0) {
            if (modoInterativo) {
                const respostaNomeProjeto = await prompts({
                    type: 'text',
                    name: 'nomeProjeto',
                    message: 'Qual o nome do seu projeto?'
                });

                nomeProjeto = respostaNomeProjeto.nomeProjeto;
            } else {
                console.error(red(
                    'Erro: Nome do projeto é obrigatório.\n' +
                    'Uso: liquido novo [nome] --tipo <mvc|api-rest> --linguagem <delegua|pitugues> --gerenciador <npm|yarn|bun> [--sim]'
                ));

                process.exit(1);
            }
        }

        if (nomeProjeto === undefined || nomeProjeto.length <= 0) {
            return;
        }

        const diretorioAlvo = nomeProjeto;

        if (nomeProjeto === '.' || nomeProjeto === './') {
            nomeProjeto = path.basename(cwd());
        }

        console.log(green(
            `Iremos criar um novo projeto em Liquido chamado "${nomeProjeto}"`
        ));

        // Confirmação (pulada com --sim)
        let confirmado = args.sim ?? false;

        if (!args.sim) {
            if (modoInterativo) {
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

                confirmado = resposta.confirmado;
            } else {
                console.error(red(
                    'Erro: Confirmação necessária. Use --sim para ambientes não-interativos.'
                ));

                process.exit(1);
            }
        }

        if (!confirmado) {
            console.info(yellow('Operação cancelada.'));
            return;
        }

        let tipoProjeto = args.tipo;

        if (!tipoProjeto) {
            if (modoInterativo) {
                const perguntaTipoProjeto = await prompts({
                    type: 'select',
                    name: 'tipoProjeto',
                    message: 'Selecione o tipo de projeto',
                    choices: [
                        { title: 'MVC', description: 'Modelo-Visão-Controlador', value: 'mvc' },
                        { title: 'API REST', description: 'Interface de dados usando o modelo REST', value: 'api-rest' }
                    ],
                    initial: 0,
                    hint: '- Use as setas. Enter para confirmar.'
                });

                tipoProjeto = perguntaTipoProjeto.tipoProjeto;
            } else {
                console.error(red(
                    'Erro: Tipo de projeto é obrigatório. Use --tipo <mvc|api-rest>.'
                ));

                process.exit(1);
            }
        }

        if (!validarTipoProjeto(tipoProjeto)) {
            console.error(red(
                `Erro: Tipo de projeto inválido: "${tipoProjeto}". Use "mvc" ou "api-rest".`
            ));

            process.exit(1);
        }

        let linguagemSelecionada = args.linguagem;

        if (!linguagemSelecionada) {
            if (modoInterativo) {
                const perguntaLinguagemDeBackEnd = await prompts({
                    type: 'select',
                    name: 'linguagemBackEnd',
                    message: 'Selecione a linguagem de programação',
                    choices: [
                        { title: 'Delégua', value: 'delegua' },
                        { title: 'Pituguês', value: 'pitugues' }
                    ],
                    initial: 0,
                    hint: '- Use as setas. Enter para confirmar.'
                });

                linguagemSelecionada = perguntaLinguagemDeBackEnd.linguagemBackEnd;
            } else {
                console.error(red(
                    'Erro: Linguagem de backend é obrigatória. Use --linguagem <delegua|pitugues>.'
                ));

                process.exit(1);
            }
        }

        if (!validarLinguagem(linguagemSelecionada)) {
            console.error(red(
                `Erro: Linguagem inválida: "${linguagemSelecionada}". Use "delegua" ou "pitugues".`
            ));

            process.exit(1);
        }

        let inicializarRepositorioGit = false;

        if (modoInterativo) {
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

            inicializarRepositorioGit = perguntaInicializarRepositorioGit.confirmado;
        }

        let gerenciadorDePacotes = args.gerenciador;

        if (!gerenciadorDePacotes) {
            if (modoInterativo) {
                const perguntaQualGerenciadorDePacotesQuerUsar = await prompts({
                    type: 'select',
                    name: 'gerenciadorDePacotes',
                    message: 'Selecione o gerenciador de pacotes que você deseja utilizar',
                    choices: [
                        { title: 'NPM', value: 'npm' },
                        { title: 'Yarn', value: 'yarn' },
                        { title: 'Bun', value: 'bun' }
                    ],
                    initial: 0,
                    hint: '- Use as setas. Enter para confirmar.'
                });

                gerenciadorDePacotes = perguntaQualGerenciadorDePacotesQuerUsar.gerenciadorDePacotes;
            } else {
                console.error(red(
                    'Erro: Gerenciador de pacotes é obrigatório. Use --gerenciador <npm|yarn|bun>.'
                ));

                process.exit(1);
            }
        }

        if (!validarGerenciadorDePacotes(gerenciadorDePacotes)) {
            console.error(red(
                `Erro: Gerenciador de pacotes inválido: "${gerenciadorDePacotes}". Use "npm", "yarn" ou "bun".`
            ));

            process.exit(1);
        }

        const diretorioCompleto = criarDiretorioAplicacao(diretorioAlvo);

        try {
            await detectarGerenciadorDePacotes(
                gerenciadorDePacotes,
                diretorioCompleto
            );
            await copiarArquivosDeExemploParaNovoProjeto(
                nomeProjeto,
                tipoProjeto,
                linguagemSelecionada,
                diretorioCompleto
            );
            await gerarRepositorioGit(
                inicializarRepositorioGit,
                diretorioCompleto
            );

            // Apaga linha residual, restaura cursor e modo raw
            if (modoInterativo) {
                try {
                    process.stdin.setRawMode(false);
                } catch (_) {
                    // Ignora erros ao restaurar modo raw
                }
            }

            process.stdout.write('\x1B[2K\x1B[0G\x1B[?25h\n');

            console.info(yellow(
                `Seu projeto foi criado com sucesso! ${diretorioCompleto}`
            ));
        } catch (erro: any) {
            // Em caso de erro, limpa o diretório recém-criado
            try {
                fs.rmSync(diretorioCompleto, { recursive: true, force: true });
            } catch (_) {
                // Ignora erro ao limpar
            }

            console.error(red(
                `Erro ao criar projeto: ${erro?.message ?? erro}`
            ));
            process.exit(1);
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
        const caminhos = ['rotas', 'visoes', 'estilos']
            .map(diretorio => path.join(process.cwd(), diretorio))
            .filter(diretorio => fs.existsSync(diretorio));
        const caminhoConfiguracao = path.join(
            process.cwd(),
            'configuracao.delprops'
        );

        if (fs.existsSync(caminhoConfiguracao)) {
            caminhos.push(caminhoConfiguracao);
        }

        return caminhos;
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

        console.info(blue(
            'Observando mudanças em rotas, visões, estilos e configuração...'
        ));

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
        .command('novo [nome]', 'Inicia uma nova aplicação pré-configurada para funcionar com Liquido.', {
            nome: { type: 'string' as const, default: '' },
            tipo: { type: 'string' as const, default: '', describe: 'Tipo de projeto: mvc ou api-rest' },
            linguagem: { type: 'string' as const, default: '', describe: 'Linguagem de backend: delegua ou pitugues' },
            sim: { type: 'boolean' as const, default: false, describe: 'Pula a confirmação inicial (modo não-interativo)' },
            gerenciador: { type: 'string' as const, default: '', describe: 'Gerenciador de pacotes: npm, yarn ou bun' }
        }, this.comandoNovo)
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
