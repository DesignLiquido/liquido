import { textSync } from 'figlet'
import { Classe } from '@designliquido/delegua/declaracoes';
import { pluralizar } from '@designliquido/flexoes';
import {
    blue,
    green,
    yellow
} from "chalk";
import yargs from 'yargs'
import prompts from 'prompts';

import {version} from './package.json'

import { Liquido } from './liquido';
import { 
    copiarExemploParaProjeto, 
    criarDiretorioAplicacao, 
    criarDiretorioSeNaoExiste, 
    documentar,
    importarModelos, 
    obterTodosModelos 
} from './interface-linha-comando';
import { ComandoGerarInterface, ComandoNovoInterface } from './interfaces';
import { GeradorVisoes } from './interface-linha-comando/gerar/gerador-visoes';
import { GeradorRotas } from './interface-linha-comando/gerar/gerador-rotas';

/**
 * Classe que representa o ponto de entrada da aplicação Liquido.
 */
class LiquidoPontoEntrada {
    logo: string

    constructor() {
        this.logo = textSync('Liquido', { horizontalLayout: 'full' })
    }

    mostrarLogo() {
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

        const declaracoes = importarModelos(nomeModelo);
        criarDiretorioAplicacao('rotas');

        const geradorVisoes = new GeradorVisoes();
        const geradorRotas = new GeradorRotas();

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
            console.log(green(`Iremos criar um novo projeto em Liquido chamado "${nomeProjeto}"`));
            const resposta = await prompts({
                type: 'confirm',
                message: 'Confirma?',
                name: 'confirmado',
                initial: true,
                onRender() {
                    this.yesMsg = 'Sim';
                    this.noMsg = 'não';
                    this.yesOption = '(S/n)';
                }
            });

            if (resposta.confirmado) {
                const diretorioCompleto = criarDiretorioAplicacao(nomeProjeto);

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

                await copiarExemploParaProjeto(perguntaTipoProjeto.tipoProjeto, diretorioCompleto);
                console.info(yellow(`Seu projeto foi criado com sucesso! ${diretorioCompleto}`))
            }
        }
    }

    comandoServidor() {
        const liquido = new Liquido(process.cwd());
        liquido.iniciar();
    }

    opcoes() {
        return yargs
        .scriptName('liquido')
        .version(version)
        .usage('Uso: $0 <comando> [opções]')
        .help('ajuda')
        .alias('ajuda', '?')
        .command(['*', 'servidor'], 'Serve o diretório local como uma aplicação para a internet.', {}, this.comandoServidor)
        .command('documentar', 'Lê o projeto e gera uma documentação OpenAPI correspondente', {}, this.comandoDocumentar)
        .command('novo [nome]', 'Inicia uma nova aplicação pré-configurada para funcionar com Liquido.', {}, this.comandoNovo)
        .command('gerar [modelo]', 'Gera controlador e visão correspondentes ao nome do modelo passado por parâmetro. O modelo deve ter um arquivo .delegua correspondente no diretório "modelos".', {}, this.comandoGerar)
        .argv
    }

    async iniciar() {
        this.mostrarLogo()
        this.opcoes()
    }
}

(async () => new LiquidoPontoEntrada().iniciar())()