import prompts from 'prompts';

import { Classe } from '@designliquido/delegua/fontes/declaracoes';

import { criarDiretorioControladoresSeNaoExiste, criarNovoControlador, importarModelos, obterTodosModelos } from './interface-linha-comando/gerar';

const pontoDeEntradaGerar = async (argumentos: string[]) => {
    // argumentos[0] normalmente é o nome do executável, seja Node, Bun, etc.
    // argumentos[1] é o nome do arquivo deste ponto de entrada.
    // argumentos[2] é o nome do modelo correspondente. Se vir vazio, perguntar o nome.
    let nomeModelo = argumentos[2];
    
    if (nomeModelo === undefined || nomeModelo.length <= 0) {
        const opcoesModelos = obterTodosModelos();

        const respostaNomeModelo = await prompts({
            type: 'select',
            name: 'nomeModelo',
            message: 'Qual o nome do modelo?',
            choices: opcoesModelos
        });

        nomeModelo = respostaNomeModelo.nomeModelo;
    }

    const declaracoes = importarModelos(nomeModelo);
    criarDiretorioControladoresSeNaoExiste();

    // Aqui apenas aceitamos declarações de classes. Pode ser mais de uma.
    for (const declaracao of declaracoes.filter((d) => d instanceof Classe)) {
        const declaracaoClasse = <Classe>declaracao;

        const caminhoControlador = criarNovoControlador(declaracaoClasse.simbolo.lexema);
        console.info(`Controlador ${caminhoControlador} criado com sucesso!`);
    }
};

pontoDeEntradaGerar(process.argv);
