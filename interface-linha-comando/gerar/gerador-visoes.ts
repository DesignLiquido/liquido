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
                corpo = `${" ".repeat(this.indentacao)}<corpo>\n${this.corpoDetalhes(declaracaoModelo)}\n${" ".repeat(this.indentacao)}</corpo>\n`;
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
        const colunasCabecaTabela: string[] = [];
        for (const propriedade of declaracaoModelo.propriedades) {
            colunasCabecaTabela.push(" ".repeat(this.indentacao * 5) + `<célula>${propriedade.nome.lexema}</célula>`);
        }

        const linhaCabecaTabela = " ".repeat(this.indentacao * 4) + '<linha>\n' +
            colunasCabecaTabela.reduce(
                (acumulador, elemento) => acumulador + '\n' + elemento
            ) +
            '\n' + " ".repeat(this.indentacao * 4) + '</linha>';

        const cabecaTabela = `${" ".repeat(this.indentacao * 3)}<cabeça-tabela>\n${linhaCabecaTabela}\n${" ".repeat(this.indentacao * 3)}</cabeça-tabela>`;

        // Colunas do corpo da tabela
        const colunasCorpoTabela: string[] = [];
        for (const propriedade of declaracaoModelo.propriedades) {
            colunasCorpoTabela.push(" ".repeat(this.indentacao * 5) + `<célula>{{${propriedade.nome.lexema}}}</célula>`);
        }

        const linhaCorpoTabela = " ".repeat(this.indentacao * 4) + '<linha>\n' +
            colunasCorpoTabela.reduce(
                (acumulador, elemento) => acumulador + '\n' + elemento
            ) +
            '\n' + " ".repeat(this.indentacao * 4) + '</linha>';

        const corpoTabela = `${" ".repeat(this.indentacao * 3)}<corpo-tabela>\n` +
            `${" ".repeat(this.indentacao * 3)}{{#cada linhas}}\n` +
            `${linhaCorpoTabela}\n` +
            `${" ".repeat(this.indentacao * 3)}{{/cada}}\n` +
            `${" ".repeat(this.indentacao * 3)}</corpo-tabela>`;

        return `${" ".repeat(this.indentacao * 2)}<tabela>\n${cabecaTabela}\n${corpoTabela}\n${" ".repeat(this.indentacao * 2)}</tabela>`;
    }

    /**
     * Função que gera o corpo de `detalhes.lmht` de cada visão gerada por linha de comando.
     * @param {Classe} declaracaoModelo A declaração do modelo de dados, com suas propriedades e definições.
     * @returns {string} Um trecho em LMHT com a estrutura do corpo da página.
     */
    private corpoDetalhes(declaracaoModelo: Classe): string {
        const titulo = `${" ".repeat(this.indentacao * 2)}<titulo1>Detalhes de ${declaracaoModelo.simbolo.lexema}</titulo1>\n`;

        const listaPropriedades: string[] = [];
        for (const propriedade of declaracaoModelo.propriedades) {
            listaPropriedades.push(" ".repeat(this.indentacao * 3) + `<termo>${propriedade.nome.lexema}</termo>`);
            listaPropriedades.push(" ".repeat(this.indentacao * 3) + `<definição>{{${propriedade.nome.lexema}}}</definição>`);
        }

        const relacaoPropriedades = `${" ".repeat(this.indentacao * 2)}<lista-definições>\n` + 
            listaPropriedades.reduce(
                (acumulador, elemento) => acumulador + '\n' + elemento
            ) +
            `\n${" ".repeat(this.indentacao * 2)}</lista-definições>\n`;

        return `${titulo}${relacaoPropriedades}`;
    }
}
