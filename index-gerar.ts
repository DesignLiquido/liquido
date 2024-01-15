import prompts from 'prompts';

import { Classe } from '@designliquido/delegua/fontes/declaracoes';
import { pluralizar } from '@designliquido/flexoes';

import { criarDiretorioSeNaoExiste, importarModelos, obterTodosModelos } from './interface-linha-comando/gerar';
import { GeradorVisoes } from './interface-linha-comando/gerar/gerador-visoes';
import { GeradorRotas } from './interface-linha-comando/gerar/gerador-rotas';

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
    criarDiretorioSeNaoExiste('rotas');

    const geradorVisoes = new GeradorVisoes();
    const geradorRotas = new GeradorRotas();

    // Aqui apenas aceitamos declarações de classes. Pode ser mais de uma.
    for (const declaracao of declaracoes.filter((d) => d instanceof Classe)) {
        const declaracaoModelo = <Classe>declaracao;
        const nomeBaseModelo = declaracaoModelo.simbolo.lexema.toLocaleLowerCase('pt');
        const nomeModeloPlural = pluralizar(nomeBaseModelo).toLocaleLowerCase('pt');

        const caminhosRotas: string[] = geradorRotas.criarNovasRotas(declaracaoModelo);
        for (const caminhoRota of caminhosRotas) {
            console.info(`Rota ${caminhoRota}`);
        }

        // Visões
        criarDiretorioSeNaoExiste('visoes', nomeModeloPlural);

        const visaoSelecionarTudo = geradorVisoes.criarNovaVisao(nomeModeloPlural, declaracaoModelo, 'selecionarTudo');
        console.info(`Visão ${visaoSelecionarTudo}`);
        const visaoSelecionarUm = geradorVisoes.criarNovaVisao(nomeModeloPlural, declaracaoModelo, 'selecionarUm');
        console.info(`Visão ${visaoSelecionarUm}`);
        const visaoAdicionar = geradorVisoes.criarNovaVisao(nomeModeloPlural, declaracaoModelo, 'adicionar');
        console.info(`Visão ${visaoAdicionar}`);
        const visaoAtualizar = geradorVisoes.criarNovaVisao(nomeModeloPlural, declaracaoModelo, 'atualizar');
        console.info(`Visão ${visaoAtualizar}`);
        const visaoExcluir = geradorVisoes.criarNovaVisao(nomeModeloPlural, declaracaoModelo, 'excluir');
        console.info(`Visão ${visaoExcluir}`);
    }
};

pontoDeEntradaGerar(process.argv);
