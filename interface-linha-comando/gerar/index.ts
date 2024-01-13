import * as sistemaArquivos from 'fs';
import * as caminho from 'path';

import { Lexador } from '@designliquido/delegua/fontes/lexador';
import { AvaliadorSintatico } from '@designliquido/delegua/fontes/avaliador-sintatico';
import { Importador } from '@designliquido/delegua-node/fontes/importador';
import { Declaracao } from '@designliquido/delegua/fontes/declaracoes';

import { TipoVisao } from './tipo-visao';

/**
 * Obtém todos os modelos do diretório 'modelos' do projeto.
 * @returns {{ title: string, value: string }[]} Um vetor com todos os arquivos de modelos encontrados.
 */
export function obterTodosModelos(): { title: string, value: string }[] {
    const diretorioModelos = caminho.join(process.cwd(), 'modelos');
    const opcoesModelos = [];

    sistemaArquivos.readdirSync(diretorioModelos).forEach((arquivo) => {
        if (arquivo.endsWith('.delegua')) {
            const prefixoArquivo = arquivo.split('.')[0];
            opcoesModelos.push({ title: prefixoArquivo, value: prefixoArquivo });
        }
    });

    return opcoesModelos;
}

/**
 * Dado o nome de um arquivo de modelos, retorna todas as declarações de modelos.
 * @param {string} nomeModelo O nome do arquivo no diretório 'modelos' que contém os modelos.
 * @returns {Declaracao[]} Um vetor de declarações de classes em Delégua.
 */
export function importarModelos(nomeModelo: string): Declaracao[] {
    const diretorioModelos = caminho.join(process.cwd(), 'modelos');
    const lexador = new Lexador(false);
    const avaliadorSintatico = new AvaliadorSintatico(false);
    const importador = new Importador(lexador, avaliadorSintatico, {}, {}, false);

    const resultadoImportacao = importador.importar(caminho.join(diretorioModelos, nomeModelo + '.delegua'));
    const declaracoes = resultadoImportacao.retornoAvaliadorSintatico.declaracoes;
    return declaracoes;
}

/**
 * Cria na raiz do projeto um diretório passado por parâmetro, se já não existir.
 * @param {string} partesDiretorio O diretório a ser verificado/criado.
 */
export function criarDiretorioSeNaoExiste(...partesDiretorio: string[]) {
    const caminhoDiretorio = caminho.join(process.cwd(), ...partesDiretorio);

    if (!sistemaArquivos.existsSync(caminhoDiretorio)) {
        sistemaArquivos.mkdirSync(caminhoDiretorio);
    }
}

/**
 * Cria um arquivo `.delegua` no diretório 'controladores' com quatro rotas: 
 * - rotaGet (para selecionar 1 ou vários registros na base de dados)
 * - rotaPost (para gravar 1 registro na base de dados)
 * - rotaPut (para alterar 1 registro na base de dados)
 * - rotaDelete (para excluir 1 registro na base de dados)
 * @param {string} nome O nome do controlador.
 * @returns {string} O caminho completo onde o controlador foi criado.
 */
export function criarNovoControlador(nome: string): string {
    const diretorioControladores = caminho.join(process.cwd(), 'controladores');

    const conteudoControlador = `liquido.rotaGet(funcao(requisicao, resposta) {\n    resposta.lmht({ "titulo": "Liquido" })\n})`;
    const caminhoControlador = caminho.join(diretorioControladores, nome + '.delegua');
    sistemaArquivos.writeFileSync(
        caminhoControlador, 
        conteudoControlador
    );

    return caminhoControlador;
}

/**
 * Cria uma nova visão, de acordo com o nome do controlador e o tipo de visão desejado.
 * @param {string} nomeControlador O nome do controlador.
 * @param {TipoVisao} tipoVisao O tipo da visão.
 * @returns O caminho completo onde a visão foi criada.
 */
export function criarNovaVisao(nomeControlador: string, tipoVisao: TipoVisao) {
    let caminhoVisao: string;
    let conteudoVisao: string;
    const diretorioVisoes = caminho.join(process.cwd(), 'visoes', nomeControlador);

    switch (tipoVisao) {
        case 'selecionarTudo':
            caminhoVisao = caminho.join(diretorioVisoes, 'inicial.lmht');
            conteudoVisao = `<lmht>\n    <cabeça><título>Teste</título></cabeça>\n<corpo>Teste</corpo>\n</lmht>`;
            break;
        case 'selecionarUm':
            caminhoVisao = caminho.join(diretorioVisoes, 'detalhes.lmht');
            conteudoVisao = `<lmht>\n    <cabeça><título>Teste</título></cabeça>\n<corpo>Teste</corpo>\n</lmht>`;
            break;
        case 'adicionar':
            caminhoVisao = caminho.join(diretorioVisoes, 'adicionar.lmht');
            conteudoVisao = `<lmht>\n    <cabeça><título>Teste</título></cabeça>\n<corpo>Teste</corpo>\n</lmht>`;
            break;
        case 'atualizar':
            caminhoVisao = caminho.join(diretorioVisoes, 'atualizar.lmht');
            conteudoVisao = `<lmht>\n    <cabeça><título>Teste</título></cabeça>\n<corpo>Teste</corpo>\n</lmht>`;
            break;
        case 'excluir':
            caminhoVisao = caminho.join(diretorioVisoes, 'excluir.lmht');
            conteudoVisao = `<lmht>\n    <cabeça><título>Teste</título></cabeça>\n<corpo>Teste</corpo>\n</lmht>`;
            break;
    }

    sistemaArquivos.writeFileSync(
        caminhoVisao, 
        conteudoVisao
    );

    return caminhoVisao;
}