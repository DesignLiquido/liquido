import prompts from 'prompts';
import { criarDiretorioAplicacao } from './interface-linha-comando';

const pontoDeEntradaNovo = async (argumentos: string[]) => {
    // argumentos[0] normalmente é o nome do executável, seja Node, Bun, etc.
    // argumentos[1] é o nome do arquivo deste ponto de entrada.
    // argumentos[2] pode ou não ter o nome do projeto.
    if (argumentos[2] && argumentos[2].length > 0) {
        console.log(`Iremos criar um novo projeto em Liquido chamado "${argumentos[2]}"`);
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
            const diretorioCompleto = criarDiretorioAplicacao(argumentos[2]);
            // process.chdir(diretorioCompleto);

            const tipoProjetoSelecionado = await prompts({
                type: 'select',
                name: 'value',
                message: 'Selecione o tipo de projeto',
                choices: [
                    { title: 'MVC', description: 'Modelo-Visão-Controlador', value: 'mvc' },
                    { title: 'API REST', description: 'Interface de dados usando o modelo REST', value: 'api-rest' }
                ],
                initial: 1
            });


        }
    }
};

pontoDeEntradaNovo(process.argv);
