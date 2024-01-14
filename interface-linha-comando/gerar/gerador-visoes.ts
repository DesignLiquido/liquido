import * as sistemaArquivos from 'fs';
import * as caminho from 'path';

import { Classe } from '@designliquido/delegua/fontes/declaracoes';

import { TipoVisao } from './tipo-visao';

export class GeradorVisoes {
    indentacao: number;

    constructor() {
        this.indentacao = 4;
    }

    /**
     * Cria uma nova visão, de acordo com o nome do controlador e o tipo de visão desejado.
     * @param {string} nomeControlador O nome do controlador.
     * @param {TipoVisao} tipoVisao O tipo da visão.
     * @returns O caminho completo onde a visão foi criada.
     */
    criarNovaVisao(nomeControlador: string, declaracaoModelo: Classe, tipoVisao: TipoVisao) {
        let caminhoVisao: string;
        let corpo: string;
        const diretorioVisoes = caminho.join(process.cwd(), 'visoes', nomeControlador);
        const cabecalhoComum = " ".repeat(this.indentacao) + '<cabeça><título>Teste</título></cabeça>\n';

        switch (tipoVisao) {
            case 'selecionarTudo':
                caminhoVisao = caminho.join(diretorioVisoes, 'inicial.lmht');
                corpo = `${" ".repeat(this.indentacao)}<corpo>\n${this.corpoInicial(declaracaoModelo)}\n${" ".repeat(this.indentacao)}</corpo>\n`;
                break;
            case 'selecionarUm':
                caminhoVisao = caminho.join(diretorioVisoes, 'detalhes.lmht');
                corpo = '    <corpo>Teste</corpo>\n';
                break;
            case 'adicionar':
                caminhoVisao = caminho.join(diretorioVisoes, 'adicionar.lmht');
                corpo = '    <corpo>Teste</corpo>\n';
                break;
            case 'atualizar':
                caminhoVisao = caminho.join(diretorioVisoes, 'atualizar.lmht');
                corpo = '    <corpo>Teste</corpo>\n';
                break;
            case 'excluir':
                caminhoVisao = caminho.join(diretorioVisoes, 'excluir.lmht');
                corpo = '    <corpo>Teste</corpo>\n';
                break;
        }

        const conteudoVisao: string = `<lmht>\n${cabecalhoComum}${corpo}</lmht>`;

        sistemaArquivos.writeFileSync(caminhoVisao, conteudoVisao);

        return caminhoVisao;
    }

    /**
     * Função que gera o corpo de `inicial.lmht` de cada visão gerada por linha de comando.
     * @param {Classe} declaracaoModelo A declaração do modelo de dados, com suas propriedades e definições.
     * @returns {string} Um trecho em LMHT com a estrutura do corpo da página.
     */
    private corpoInicial(declaracaoModelo: Classe): string {
        // Colunas de cabeçalho
        const colunasTabela: string[] = [];
        for (const propriedade of declaracaoModelo.propriedades) {
            colunasTabela.push(" ".repeat(this.indentacao * 5) + `<célula>${propriedade.nome.lexema}</célula>`);
        }

        const linhaCabecaTabela = " ".repeat(this.indentacao * 4) + '<linha>\n' +
            colunasTabela.reduce(
                (acumulador, elemento) => acumulador + '\n' + elemento
            ) +
            '\n' + " ".repeat(this.indentacao * 4) + '</linha>';

        const cabecaTabela = `${" ".repeat(this.indentacao * 3)}<cabeça-tabela>\n${linhaCabecaTabela}\n${" ".repeat(this.indentacao * 3)}</cabeça-tabela>`;

        // Colunas do corpo da tabela
        const linhaCorpoTabela = " ".repeat(this.indentacao * 4) + '<linha>\n' +
            colunasTabela.reduce(
                (acumulador, elemento) => acumulador + '\n' + elemento
            ) +
            '\n' + " ".repeat(this.indentacao * 4) + '</linha>';

        const corpoTabela = `${" ".repeat(this.indentacao * 3)}<corpo-tabela>\n${linhaCorpoTabela}\n${" ".repeat(this.indentacao * 3)}</corpo-tabela>`;

        return `${" ".repeat(this.indentacao * 2)}<tabela>\n${cabecaTabela}\n${corpoTabela}\n${" ".repeat(this.indentacao * 2)}</tabela>`;
    }
}
