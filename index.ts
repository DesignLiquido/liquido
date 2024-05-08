import { textSync } from 'figlet'
import {version} from './package.json'
import {
    blue,
    green,
    yellow
} from "chalk";
import yargs from 'yargs'
import { Liquido } from './liquido';
import { ComandoNovoInterface } from 'interfaces';
import prompts from 'prompts';
import { copiarExemploParaProjeto, criarDiretorioAplicacao } from './interface-linha-comando';

class LiquidoCli {
    logo: string

    constructor() {
        this.logo = textSync('Liquido', { horizontalLayout: 'full' })
    }

    mostrarLogo() {
        console.log(blue(this.logo + '\n'))
    }

    comandoServidor() {
        const liquido = new Liquido(process.cwd())
        liquido.iniciar()
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

    comandoGerar() {}

    opcoes() {
        return yargs
        .scriptName('liquido')
        .version(version)
        .usage('Uso: $0 <comando> [opções]')
        .help('ajuda')
        .alias('ajuda', '?')
        .command('servidor', 'Serve o diretório local como uma aplicação para a internet.', {}, this.comandoServidor)
        .command('novo [nome]', 'Inicia uma nova aplicação pré-configurada para funcionar com Liquido.', {}, this.comandoNovo)
        .command('gerar [modelo]', 'Gera controlador e visão correspondentes ao nome do modelo passado por parâmetro. O modelo deve ter um arquivo .delegua correspondente no diretório "modelos".', {}, this.comandoGerar)
        .argv
    }

    async iniciar() {
        this.mostrarLogo()
        this.opcoes()
    }
}

(async () => new LiquidoCli().iniciar())()