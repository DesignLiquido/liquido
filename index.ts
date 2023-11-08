import { Command } from 'commander';

const pontoDeEntrada = async () => {
    const analisadorArgumentos = new Command();
    analisadorArgumentos;

    analisadorArgumentos
        .helpOption('-?, --ajuda', 'Exibe a ajuda para o comando.')
        .command('servidor', 'Serve o diretório local como uma aplicação para a internet.', { isDefault: true })
        .command('novo [nome]', 'Inicia uma nova aplicação pré-configurada para funcionar com Liquido.');

    analisadorArgumentos.parse();
}

pontoDeEntrada();