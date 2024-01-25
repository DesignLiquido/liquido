import * as sistemaArquivos from 'fs';
import * as caminho from 'path';

import { Classe } from '@designliquido/delegua/fontes/declaracoes';

import { TipoVisao } from './tipo-visao';
import { pluralizar } from '@designliquido/flexoes';

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
        let cabecalho: string;
        const diretorioVisoes = caminho.join(process.cwd(), 'visoes', nomeControlador);

        switch (tipoVisao) {
            case 'selecionarTudo':
                caminhoVisao = caminho.join(diretorioVisoes, 'inicial.lmht');
                cabecalho = " ".repeat(this.indentacao) + `<cabeça><título>Listagem de Entidades ${declaracaoModelo.simbolo.lexema}</título></cabeça>\n`;
                corpo = `${" ".repeat(this.indentacao)}<corpo>\n${this.corpoInicial(declaracaoModelo)}\n${" ".repeat(this.indentacao)}</corpo>\n`;
                break;
            case 'selecionarUm':
                caminhoVisao = caminho.join(diretorioVisoes, 'detalhes.lmht');
                cabecalho = " ".repeat(this.indentacao) + `<cabeça><título>Detalhes de ${declaracaoModelo.simbolo.lexema}</título></cabeça>\n`;
                corpo = `${" ".repeat(this.indentacao)}<corpo>\n${this.corpoDetalhes(declaracaoModelo)}\n${" ".repeat(this.indentacao)}</corpo>\n`;
                break;
            case 'adicionar':
                caminhoVisao = caminho.join(diretorioVisoes, 'adicionar.lmht');
                cabecalho = " ".repeat(this.indentacao) + `<cabeça><título>Adicionar ${declaracaoModelo.simbolo.lexema}</título></cabeça>\n`;
                corpo = `${" ".repeat(this.indentacao)}<corpo>\n${this.corpoAdicionar(declaracaoModelo)}\n${" ".repeat(this.indentacao)}</corpo>\n`;
                break;
            case 'editar':
                caminhoVisao = caminho.join(diretorioVisoes, 'editar.lmht');
                cabecalho = " ".repeat(this.indentacao) + `<cabeça><título>Editar ${declaracaoModelo.simbolo.lexema}</título></cabeça>\n`;
                corpo = `${" ".repeat(this.indentacao)}<corpo>\n${this.corpoEditar(declaracaoModelo)}\n${" ".repeat(this.indentacao)}</corpo>\n`;
                break;
            case 'excluir':
                caminhoVisao = caminho.join(diretorioVisoes, 'excluir.lmht');
                cabecalho = " ".repeat(this.indentacao) + `<cabeça><título>Confirmar Exclusão de ${declaracaoModelo.simbolo.lexema}</título></cabeça>\n`;
                corpo = `${" ".repeat(this.indentacao)}<corpo>\n${this.corpoConfirmarExclusao(declaracaoModelo)}\n${" ".repeat(this.indentacao)}</corpo>\n`;
                break;
        }

        const conteudoVisao: string = `<lmht>\n${cabecalho}${corpo}</lmht>`;

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
            '\n' + " ".repeat(this.indentacao * 5) + `<célula>Ações</célula>` +
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
            '\n' + " ".repeat(this.indentacao * 5) + `<célula>` +
            '\n' + `${" ".repeat(this.indentacao * 6)}<ligação destino="/${pluralizar(declaracaoModelo.simbolo.lexema.toLocaleLowerCase())}/{{id}}">Detalhes</ligação> |` +
            '\n' + `${" ".repeat(this.indentacao * 6)}<ligação destino="/${pluralizar(declaracaoModelo.simbolo.lexema.toLocaleLowerCase())}/{{id}}/editar">Editar</ligação> |` +
            '\n' + `${" ".repeat(this.indentacao * 6)}<ligação destino="/${pluralizar(declaracaoModelo.simbolo.lexema.toLocaleLowerCase())}/{{id}}/excluir">Excluir</ligação>` +
            `\n${" ".repeat(this.indentacao * 5)}</célula>` +
            '\n' + " ".repeat(this.indentacao * 4) + '</linha>';

        const corpoTabela = `${" ".repeat(this.indentacao * 3)}<corpo-tabela>\n` +
            `${" ".repeat(this.indentacao * 3)}{{#cada linhas}}\n` +
            `${linhaCorpoTabela}\n` +
            `${" ".repeat(this.indentacao * 3)}{{/cada}}\n` +
            `${" ".repeat(this.indentacao * 3)}</corpo-tabela>`;

        return `${" ".repeat(this.indentacao * 2)}<tabela>\n${cabecaTabela}\n${corpoTabela}\n${" ".repeat(this.indentacao * 2)}</tabela>`;
    }

    private geracaoComumCamposDetalhes(declaracaoModelo: Classe): string {
        const listaPropriedades: string[] = [];
        for (const propriedade of declaracaoModelo.propriedades) {
            listaPropriedades.push(" ".repeat(this.indentacao * 3) + `<termo>${propriedade.nome.lexema}</termo>`);
            listaPropriedades.push(" ".repeat(this.indentacao * 3) + `<definição>{{${propriedade.nome.lexema}}}</definição>`);
        }

        return listaPropriedades.reduce(
            (acumulador, elemento) => acumulador + '\n' + elemento
        );
    }

    /**
     * Função que gera o corpo de `detalhes.lmht` de cada visão gerada por linha de comando.
     * @param {Classe} declaracaoModelo A declaração do modelo de dados, com suas propriedades e definições.
     * @returns {string} Um trecho em LMHT com a estrutura do corpo da página.
     */
    private corpoDetalhes(declaracaoModelo: Classe): string {
        const titulo = `${" ".repeat(this.indentacao * 2)}<titulo1>Detalhes de ${declaracaoModelo.simbolo.lexema}</titulo1>\n`;

        const relacaoPropriedades = `${" ".repeat(this.indentacao * 2)}<lista-definições>\n` + 
            this.geracaoComumCamposDetalhes(declaracaoModelo) +
            `\n${" ".repeat(this.indentacao * 2)}</lista-definições>\n\n` +
            `${" ".repeat(this.indentacao * 2)}<ligação destino="/${pluralizar(declaracaoModelo.simbolo.lexema.toLocaleLowerCase())}/{{id}}/editar">Editar</ligação> |\n` +
            `${" ".repeat(this.indentacao * 2)}<ligação destino="/${pluralizar(declaracaoModelo.simbolo.lexema.toLocaleLowerCase())}/{{id}}/excluir">Excluir</ligação>\n` ;

        return `${titulo}${relacaoPropriedades}`;
    }

    private geracaoComumCamposFormulario(declaracaoModelo: Classe): string {
        const listaPropriedades: string[] = [];
        for (const propriedade of declaracaoModelo.propriedades) {
            listaPropriedades.push(" ".repeat(this.indentacao * 4) + `<etiqueta para="${propriedade.nome.lexema}">${propriedade.nome.lexema}</etiqueta>`);
            listaPropriedades.push(" ".repeat(this.indentacao * 4) + `<campo tipo="texto" id="${propriedade.nome.lexema}" value={{${propriedade.nome.lexema}}}></campo>`);
        }

        return listaPropriedades.reduce(
            (acumulador, elemento) => acumulador + '\n' + elemento
        );
    }

    /**
     * Função que gera o corpo de `adicionar.lmht` de cada visão gerada por linha de comando.
     * @param {Classe} declaracaoModelo A declaração do modelo de dados, com suas propriedades e definições.
     * @returns {string} Um trecho em LMHT com a estrutura do corpo da página.
     */
    private corpoAdicionar(declaracaoModelo: Classe): string {
        const titulo = `${" ".repeat(this.indentacao * 2)}<titulo1>Adicionar ${declaracaoModelo.simbolo.lexema}</titulo1>\n`;

        const relacaoPropriedades = `${" ".repeat(this.indentacao * 3)}<campos>\n` + 
            this.geracaoComumCamposFormulario(declaracaoModelo) +
            `\n${" ".repeat(this.indentacao * 3)}</campos>\n`;

        const formulario = `${" ".repeat(this.indentacao * 2)}<formulário método="POST" ação="/${pluralizar(declaracaoModelo.simbolo.lexema.toLocaleLowerCase())}">\n` + 
            `${relacaoPropriedades}` +
            `\n\n${" ".repeat(this.indentacao * 3)}<campo tipo="enviar">Adicionar</campo>\n` +
            `${" ".repeat(this.indentacao * 2)}</formulário>\n`;
        return `${titulo}${formulario}`;
    }

    /**
     * Função que gera o corpo de `editar.lmht` de cada visão gerada por linha de comando.
     * @param {Classe} declaracaoModelo A declaração do modelo de dados, com suas propriedades e definições.
     * @returns {string} Um trecho em LMHT com a estrutura do corpo da página.
     */
    private corpoEditar(declaracaoModelo: Classe): string {
        const titulo = `${" ".repeat(this.indentacao * 2)}<titulo1>Editar ${declaracaoModelo.simbolo.lexema}</titulo1>\n`;

        const relacaoPropriedades = `${" ".repeat(this.indentacao * 3)}<campos>\n` + 
            `${" ".repeat(this.indentacao * 4)}<campo tipo="escondido" id="id"></campo>\n` +
            this.geracaoComumCamposFormulario(declaracaoModelo) +
            `\n\n${" ".repeat(this.indentacao * 4)}<campo tipo="enviar">Atualizar</campo>\n` +
            `\n${" ".repeat(this.indentacao * 3)}</campos>\n`;

        const formulario = `${" ".repeat(this.indentacao * 2)}<formulário método="POST" ação="/${pluralizar(declaracaoModelo.simbolo.lexema.toLocaleLowerCase())}/{{id}}/editar">\n`+ 
            `${relacaoPropriedades}` +
            `${" ".repeat(this.indentacao * 2)}</formulário>\n`;
        return `${titulo}${formulario}`;
    }

    /**
     * Função que gera o corpo de `excluir.lmht` de cada visão gerada por linha de comando.
     * @param {Classe} declaracaoModelo A declaração do modelo de dados, com suas propriedades e definições.
     * @returns {string} Um trecho em LMHT com a estrutura do corpo da página.
     */
    private corpoConfirmarExclusao(declaracaoModelo: Classe): string {
        const titulo = `${" ".repeat(this.indentacao * 2)}<titulo1>Confirmar Exclusão de ${declaracaoModelo.simbolo.lexema}</titulo1>\n`;
        const mensagemConfirmacaoExclusao = `${" ".repeat(this.indentacao * 2)}<titulo3>Tem certeza de que deseja excluir o registro abaixo?</titulo3>\n`;

        const relacaoPropriedades = `${" ".repeat(this.indentacao * 2)}<lista-definições>\n` + 
            this.geracaoComumCamposDetalhes(declaracaoModelo) +
            `\n${" ".repeat(this.indentacao * 2)}</lista-definições>\n`;

        const formulario = `${" ".repeat(this.indentacao * 2)}<formulário método="POST" ação="/${pluralizar(declaracaoModelo.simbolo.lexema.toLocaleLowerCase())}/{{id}}/excluir">\n`+
            `${" ".repeat(this.indentacao * 3)}<campo tipo="escondido" id="id" value={{id}}></campo>\n` +
            `${" ".repeat(this.indentacao * 3)}<campo tipo="enviar">Confirmar Exclusão</campo>\n` +
            `${" ".repeat(this.indentacao * 2)}</formulário>\n`;

        return `${titulo}${mensagemConfirmacaoExclusao}${relacaoPropriedades}${formulario}`;
    }
}
