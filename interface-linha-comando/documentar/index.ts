import { async as glob } from 'fast-glob';
// import sistemaArquivos from 'fs';
import caminho from 'path';

import { Lexador, AvaliadorSintatico, ErroAvaliadorSintatico, Declaracao, Expressao, Chamada, AcessoMetodoOuPropriedade } from '@designliquido/delegua';
import { Importador } from '@designliquido/delegua-node/importador';
// import { Interpretador } from '@designliquido/delegua-node/interpretador';

// TODO: Pensar em como fazer isso considerando importações de outros arquivos.
function obterEstruturasDeAltoNivelDeControlador(caminhoControlador: string) {
    const arquivosAbertos = {};
    const conteudoArquivosAbertos = {};

    const importador = new Importador(
        new Lexador(),
            new AvaliadorSintatico(),
            arquivosAbertos,
            conteudoArquivosAbertos,
            false
    );

    const retornoImportador = importador.importar(caminhoControlador);
    if (retornoImportador.retornoAvaliadorSintatico.erros.length > 0) {
        throw new Error(
            `O controlador em ${caminhoControlador} possui erros: ${retornoImportador.retornoAvaliadorSintatico.erros.map((erro: ErroAvaliadorSintatico) => ' - ' + erro.message + '\n')}`
        )
    }

    return retornoImportador.retornoAvaliadorSintatico.declaracoes;
}

/**
 * Para cada declaração vinda de um controlador, o que se espera são um
 * vetor de expressões, sendo cada expressão contendo pelo menos uma chamada
 * a um dos métodos de Liquido. Normalmente, esses métodos são `rotaGet`, `rotaPost`,
 * etc.
 * @param declaracoes 
 */
function lerControlador(declaracoes: Declaracao[]) {
    for (const declaracao of declaracoes) {
        // Os decoradores contêm a documentação adicional para uma rota.
        const decoradores = declaracao.decoradores;
        // Aqui normalmente teremos uma expressão com uma chamada dentro.
        const chamada = (declaracao as Expressao).expressao as Chamada;
        // Tipicamente, a entidade chamada é uma variável com o nome reservado `liquido`.
        // o método é um Símbolo. 
        // A execução e middlewares ficam em argumentos.
        const entidadeChamada = chamada.entidadeChamada as AcessoMetodoOuPropriedade;
        const argumentos = chamada.argumentos;
        console.log(decoradores, argumentos, entidadeChamada.objeto, entidadeChamada.simbolo);
    }
}

export async function encontrarControladores() {
    const diretorioRotas = caminho.join(process.cwd(), 'rotas/rest');
    const formatoGlob = (diretorioRotas + '/**/*.delegua').replace(/\\/gi, '/');
    const arquivos = await glob([formatoGlob], {
        dot: true,
        absolute: false,
        stats: false,
    });

    // const interpretador = new Interpretador(importador, process.cwd(), false, console.log);

    for (const caminhoArquivo of arquivos) {
        console.log(caminhoArquivo);
        const estruturas = obterEstruturasDeAltoNivelDeControlador(caminhoArquivo);
        lerControlador(estruturas);
    }
}
