import { Liquido } from './liquido';
import { Command } from 'commander';

const pontoDeEntrada = async () => {
    const analisadorArgumentos = new Command();
    analisadorArgumentos;

    analisadorArgumentos
        .helpOption('-h, --ajuda', 'Exibe a ajuda para o comando.');

    analisadorArgumentos
        .command('servidor', 'Serve o diretório local como uma aplicação para a internet.', { isDefault: true })
        .action(() => {
            const liquido = new Liquido(process.cwd());
            liquido.iniciar();
        });

    analisadorArgumentos
        .command('novo <nome>', 'Inicia uma nova aplicação pré-configurada para funcionar com Liquido.')
        .action((nome: string) => {
            console.log(nome);
        });

    analisadorArgumentos.parse();
}

pontoDeEntrada();