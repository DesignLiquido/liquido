import prompts from 'prompts';

import { Classe } from '@designliquido/delegua/fontes/declaracoes';
import { pluralizar } from '@designliquido/flexoes';

import { criarDiretorioSeNaoExiste, criarNovaVisao, criarNovoControlador, importarModelos, obterTodosModelos } from './interface-linha-comando/gerar';

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
    criarDiretorioSeNaoExiste('controladores');

    // Aqui apenas aceitamos declarações de classes. Pode ser mais de uma.
    for (const declaracao of declaracoes.filter((d) => d instanceof Classe)) {
        const declaracaoClasse = <Classe>declaracao;
        const nomeBaseModelo = declaracaoClasse.simbolo.lexema.toLocaleLowerCase('pt');
        const nomeControladorPlural = pluralizar(nomeBaseModelo).toLocaleLowerCase('pt');

        const caminhoControlador = criarNovoControlador(nomeControladorPlural);
        console.info(`Controlador ${caminhoControlador}`);

        // Visões
        criarDiretorioSeNaoExiste('visoes', nomeControladorPlural);

        const visaoSelecionarTudo = criarNovaVisao(nomeControladorPlural, 'selecionarTudo');
        console.info(`Visão ${visaoSelecionarTudo}`);
        const visaoSelecionarUm = criarNovaVisao(nomeControladorPlural, 'selecionarUm');
        console.info(`Visão ${visaoSelecionarUm}`);
        const visaoAdicionar = criarNovaVisao(nomeControladorPlural, 'adicionar');
        console.info(`Visão ${visaoAdicionar}`);
        const visaoAtualizar = criarNovaVisao(nomeControladorPlural, 'atualizar');
        console.info(`Visão ${visaoAtualizar}`);
        const visaoExcluir = criarNovaVisao(nomeControladorPlural, 'excluir');
        console.info(`Visão ${visaoExcluir}`);
    }
};

pontoDeEntradaGerar(process.argv);
