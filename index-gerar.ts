import prompts from 'prompts';
import * as sistemaArquivos from 'fs';
import * as caminho from 'path';

const pontoDeEntradaGerar = async (argumentos: string[]) => {
    // argumentos[0] normalmente é o nome do executável, seja Node, Bun, etc.
    // argumentos[1] é o nome do arquivo deste ponto de entrada.
    // argumentos[2] é o nome do modelo correspondente. Se vir vazio, perguntar o nome.
    let nomeModelo = argumentos[2];
    if (nomeModelo === undefined || nomeModelo.length <= 0) {
        const opcoesModelos = [];
        sistemaArquivos.readdirSync(caminho.join(process.cwd(), "modelos")).forEach(arquivo => {
            if (arquivo.endsWith('.delegua')) {
                const prefixoArquivo = arquivo.split('.')[0];
                opcoesModelos.push({title: prefixoArquivo, value: prefixoArquivo});
            }
        });

        const respostaNomeModelo = await prompts({
            type: 'select',
            name: 'nomeModelo',
            message: 'Qual o nome do modelo?',
            choices: opcoesModelos
        });

        nomeModelo = respostaNomeModelo.nomeModelo;
    }
};

pontoDeEntradaGerar(process.argv);
