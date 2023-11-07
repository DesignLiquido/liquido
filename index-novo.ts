import sistemaArquivos from 'fs';
import caminho from 'path';

import prompts from 'prompts';

const pontoDeEntradaNovo = async (argumentos: string[]) => {
    // argumentos[0] normalmente é o nome do executável, seja Node, Bun, etc.
    // argumentos[1] é o nome do arquivo deste ponto de entrada.
    // argumentos[2] pode ou não ter o nome do projeto.
    if (argumentos[2] && argumentos[2].length > 0) {
        console.log(`Iremos criar um novo projeto em Liquido chamado "${argumentos[2]}"`);
        const resposta = await prompts({
            type: 'confirm',
            message: 'Confirma?',
            initial: true,
            onRender() {
                this.yesMsg = 'Sim';
                this.noMsg = 'não';
                this.yesOption = '(S/n)';
            }
        });

        if (resposta.value && !sistemaArquivos.existsSync(argumentos[2])) {
            sistemaArquivos.mkdirSync(argumentos[2]);
            console.log(`Diretório criado: ${process.cwd() + caminho.sep + argumentos[2]}`);
        }
    }
}

pontoDeEntradaNovo(process.argv);