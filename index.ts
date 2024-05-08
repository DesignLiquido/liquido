import { textSync } from 'figlet'
import {version} from './package.json'
import {blue} from "chalk";
import yargs from 'yargs'

class LiquidoCli {
    logo: string

    constructor() {
        this.logo = textSync('Liquido', { horizontalLayout: 'full' })
    }

    mostrarLogo() {
        console.log(blue(this.logo + '\n'))
    }

    comandoServidor() {
        
    }

    comandoNovo() {}

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