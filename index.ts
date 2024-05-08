import { textSync } from 'figlet'
import { Command } from 'commander'
import {version} from './package.json'

const pontoDeEntrada = async () => {
    console.log(textSync("Delegua"))
    const analisadorArgumentos = new Command();

    analisadorArgumentos
        .version(version)
        .description("Conjunto de ferramentas para desenvolvimento de aplicações para a internet 100% em português.")
        .helpOption('-?, --ajuda', 'Exibe a ajuda para o comando.')
        .command('servidor', 'Serve o diretório local como uma aplicação para a internet.', { isDefault: true })
        .command('novo [nome]', 'Inicia uma nova aplicação pré-configurada para funcionar com Liquido.')
        .command('gerar [modelo]', 'Gera controlador e visão correspondentes ao nome do modelo passado por parâmetro. O modelo deve ter um arquivo .delegua correspondente no diretório "modelos".');

    analisadorArgumentos.parse(process.argv);
}

pontoDeEntrada();