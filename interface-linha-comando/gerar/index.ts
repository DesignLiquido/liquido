import * as sistemaArquivos from 'fs';
import * as caminho from 'path';

import { Lexador } from '@designliquido/delegua/fontes/lexador';
import { AvaliadorSintatico } from '@designliquido/delegua/fontes/avaliador-sintatico';
import { Importador } from '@designliquido/delegua-node/fontes/importador';
import { Declaracao } from '@designliquido/delegua/fontes/declaracoes';

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

    const conteudoSelecionarTudo = `liquido.rotaGet(funcao(requisicao, resposta) {\n    resposta.lmht({ "titulo": "Liquido" })\n})\n\n`;
    const conteudoAdicionar = `liquido.rotaPost(funcao(requisicao, resposta) {\n    resposta.lmht({ "titulo": "Liquido" })\n})\n\n`;
    const conteudoAtualizar = `liquido.rotaPut(funcao(requisicao, resposta) {\n    resposta.lmht({ "titulo": "Liquido" })\n})\n\n`;
    const conteudoExcluir = `liquido.rotaDelete(funcao(requisicao, resposta) {\n    resposta.lmht({ "titulo": "Liquido" })\n})\n\n`;
    const conteudoControlador = `${conteudoSelecionarTudo}${conteudoAdicionar}${conteudoAtualizar}${conteudoExcluir}`;
    const caminhoControlador = caminho.join(diretorioControladores, nome + '.delegua');
    sistemaArquivos.writeFileSync(
        caminhoControlador, 
        conteudoControlador
    );

    return caminhoControlador;
}

