import * as sistemaArquivos from 'fs';
import * as caminho from 'path';

import prompts from 'prompts';

import { Lexador } from '@designliquido/delegua/fontes/lexador';
import { AvaliadorSintatico } from '@designliquido/delegua/fontes/avaliador-sintatico';
import { Importador } from '@designliquido/delegua-node/fontes/importador';
import { Classe } from '@designliquido/delegua/fontes/declaracoes';
import { pluralizar } from '@designliquido/flexoes';

const pontoDeEntradaGerar = async (argumentos: string[]) => {
    // argumentos[0] normalmente é o nome do executável, seja Node, Bun, etc.
    // argumentos[1] é o nome do arquivo deste ponto de entrada.
    // argumentos[2] é o nome do modelo correspondente. Se vir vazio, perguntar o nome.
    let nomeModelo = argumentos[2];
    const diretorioModelos = caminho.join(process.cwd(), 'modelos');
    if (nomeModelo === undefined || nomeModelo.length <= 0) {
        const opcoesModelos = [];
        sistemaArquivos.readdirSync(diretorioModelos).forEach((arquivo) => {
            if (arquivo.endsWith('.delegua')) {
                const prefixoArquivo = arquivo.split('.')[0];
                opcoesModelos.push({ title: prefixoArquivo, value: prefixoArquivo });
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

    const lexador = new Lexador(false);
    const avaliadorSintatico = new AvaliadorSintatico(false);
    const importador = new Importador(lexador, avaliadorSintatico, {}, {}, false);

    const resultadoImportacao = importador.importar(caminho.join(diretorioModelos, nomeModelo + '.delegua'));
    const declaracoes = resultadoImportacao.retornoAvaliadorSintatico.declaracoes;

    // Aqui apenas aceitamos declarações de classes. Pode ser mais de uma.
    for (const declaracao of declaracoes.filter((d) => d instanceof Classe)) {
        const declaracaoClasse = <Classe>declaracao;

        const diretorioControladores = caminho.join(process.cwd(), 'controladores');

        if (!sistemaArquivos.existsSync(diretorioControladores)) {
            sistemaArquivos.mkdirSync(diretorioControladores);
        }

        // Controlador: cria-se um arquivo `.delegua` com quatro rotas: rotaGet, rotaPost, rotaPut, rotaDelete.
        const nomeControladorPlural = pluralizar(declaracaoClasse.simbolo.lexema).toLocaleLowerCase('pt');

        const conteudoControlador = `liquido.rotaGet(funcao(requisicao, resposta) {\n    resposta.lmht({ "titulo": "Liquido" })\n})`;
        const caminhoControlador = caminho.join(diretorioControladores, nomeControladorPlural + '.delegua');
        sistemaArquivos.writeFileSync(
            caminhoControlador, 
            conteudoControlador
        );

        console.info(`Controlador ${caminhoControlador} criado com sucesso!`);
    }
};

pontoDeEntradaGerar(process.argv);
