import * as sistemaArquivos from 'fs';
import * as caminho from 'path';

import { Classe } from '@designliquido/delegua/fontes/declaracoes';
import { pluralizar } from '@designliquido/flexoes';
import { criarDiretorioComIdSeNaoExiste, criarDiretorioSeNaoExiste } from '.';

export class GeradorRotas {
    indentacao: number;

    constructor() {
        this.indentacao = 4;
    }

    /**
     * Cria arquivos `.delegua` no diretório 'rotas/<modelo no plural>' com cinco rotas: 
     * - Arquivo `inicial.delegua`
     *     - rotaGet (para selecionar vários registros na base de dados)
     *     - rotaPost (para gravar 1 registro na base de dados)
     * - Arquivo `[id].delegua`
     *     - rotaGet (para selecionar 1 registro por id na base de dados)
     *     - rotaPut (para alterar 1 registro na base de dados)
     *     - rotaDelete (para excluir 1 registro na base de dados)
     * @param {Classe} declaracaoModelo O descritor do modelo, com suas propriedades.
     * @returns {string[]} Os caminhos completos onde os arquivos de rotas foram criados.
     */
    criarNovasRotas(declaracaoModelo: Classe): string[] {
        const nomeBaseModelo = declaracaoModelo.simbolo.lexema.toLocaleLowerCase('pt');
        const nomeModeloPlural = pluralizar(nomeBaseModelo).toLocaleLowerCase('pt');
        const diretorioRotas = caminho.join(process.cwd(), 'rotas', nomeModeloPlural);

        criarDiretorioSeNaoExiste('rotas', nomeModeloPlural);

        let rotasCriadas = [];
        rotasCriadas.push(this.criarNovasRotasSemId(declaracaoModelo, diretorioRotas));
        rotasCriadas = rotasCriadas.concat(this.criarNovasRotasComId(declaracaoModelo, diretorioRotas));
        return rotasCriadas;
    }

    /**
     * Gera arquivo de rotas que não usam um id como sufixo.
     * @param {Classe} declaracaoModelo O descritor do modelo, com suas propriedades.
     * @param {string} diretorioRotas O diretório onde o arquivo de rotas deve ser salvo.
     * @returns O caminho do arquivo de rotas no sistema de arquivos.
     */
    private criarNovasRotasSemId(declaracaoModelo: Classe, diretorioRotas: string): string {
        const conteudoSelecionarTudo = this.criarRotaSelecionarTudo(declaracaoModelo);
        const nomeModeloPlural = pluralizar(declaracaoModelo.simbolo.lexema.toLocaleLowerCase('pt')).toLocaleLowerCase('pt');
        const conteudoAdicionar = `liquido.rotaPost(funcao(requisicao, resposta) {\n    resposta.redirecionar("/${nomeModeloPlural}")\n})\n\n`;
        const conteudoRotas = `${conteudoSelecionarTudo}${conteudoAdicionar}`;

        const caminhoRotas = caminho.join(diretorioRotas, 'inicial.delegua');
        sistemaArquivos.writeFileSync(
            caminhoRotas, 
            conteudoRotas
        );

        return caminhoRotas;
    }

    /**
     * Gera arquivo de rotas que usam id como sufixo.
     * @param {Classe} declaracaoModelo O descritor do modelo, com suas propriedades.
     * @param {string} diretorioRotas O diretório onde o arquivo de rotas deve ser salvo.
     * @returns O caminho do arquivo de rotas no sistema de arquivos.
     */
    private criarNovasRotasComId(declaracaoModelo: Classe, diretorioRotas: string): string[] {
        const nomeModeloPlural = pluralizar(declaracaoModelo.simbolo.lexema.toLocaleLowerCase('pt')).toLocaleLowerCase('pt');
        const conteudoSelecionarUm = this.criarRotaSelecionarUm(declaracaoModelo);
        const conteudoSelecionarParaEdicao = this.criarRotaEditar(declaracaoModelo);
        const conteudoAtualizar = `liquido.rotaPost(funcao(requisicao, resposta) {\n    resposta.redirecionar("/${nomeModeloPlural}")\n})\n\n`;
        const conteudoSelecionarParaExclusao = this.criarRotaConfirmarExclusao(declaracaoModelo);
        const conteudoExcluir = `liquido.rotaPost(funcao(requisicao, resposta) {\n    resposta.redirecionar("/${nomeModeloPlural}")\n})\n\n`;

        const diretorioRotasComId = criarDiretorioComIdSeNaoExiste(diretorioRotas);

        const caminhoRotasId = caminho.join(diretorioRotasComId, 'inicial.delegua');
        sistemaArquivos.writeFileSync(
            caminhoRotasId, 
            `${conteudoSelecionarUm}`
        );

        const caminhoRotaEditar = caminho.join(diretorioRotasComId, 'editar.delegua');
        sistemaArquivos.writeFileSync(
            caminhoRotaEditar, 
            `${conteudoSelecionarParaEdicao}${conteudoAtualizar}`
        );

        const caminhoRotaExcluir = caminho.join(diretorioRotasComId, 'excluir.delegua');
        sistemaArquivos.writeFileSync(
            caminhoRotaExcluir, 
            `${conteudoSelecionarParaExclusao}${conteudoExcluir}`
        );

        return [caminhoRotasId, caminhoRotaEditar, caminhoRotaExcluir];
    }

    private criarRotaSelecionarTudo(declaracaoModelo: Classe) {
        // Isso aqui não vai ficar assim. 
        // É preciso montar as partes de dados antes.
        const dadosTestes = [];
        for (const propriedade of declaracaoModelo.propriedades) {
            dadosTestes.push(`"${propriedade.nome.lexema}": "Teste"`);
        }

        return `liquido.rotaGet(funcao(requisicao, resposta) {\n` +
            `${" ".repeat(this.indentacao)}resposta.lmht({\n` +
            `${" ".repeat(this.indentacao * 2)}"linhas": [\n` + 
            `${" ".repeat(this.indentacao * 3)}{${dadosTestes.reduce(
                (acumulador, elemento) => acumulador + ', ' + elemento
            )}}\n` +
            `${" ".repeat(this.indentacao * 2)}]\n` +
            `${" ".repeat(this.indentacao)}})\n` +
            `})\n\n`;
    }

    private criarRotaSelecionarUm(declaracaoModelo: Classe): string {
        // Isso aqui não vai ficar assim. 
        // É preciso montar as partes de dados antes.
        const dadosTestes = [];
        for (const propriedade of declaracaoModelo.propriedades) {
            dadosTestes.push(`"${propriedade.nome.lexema}": "Teste"`);
        }

        return `liquido.rotaGet(funcao(requisicao, resposta) {\n` +
            `${" ".repeat(this.indentacao)}resposta.lmht("detalhes", {\n` +
            `${" ".repeat(this.indentacao * 2)}${dadosTestes.reduce(
                (acumulador, elemento) => acumulador + ', ' + elemento
            )}\n` +
            `${" ".repeat(this.indentacao)}})\n` +
            `})\n\n`;
    }

    private criarRotaEditar(declaracaoModelo: Classe): string {
        // Isso aqui não vai ficar assim. 
        // É preciso montar as partes de dados antes.
        const dadosTestes = [];
        for (const propriedade of declaracaoModelo.propriedades) {
            dadosTestes.push(`"${propriedade.nome.lexema}": "Teste"`);
        }

        return `liquido.rotaGet(funcao(requisicao, resposta) {\n` +
        `${" ".repeat(this.indentacao)}resposta.lmht("editar", {\n` +
        `${" ".repeat(this.indentacao * 2)}${dadosTestes.reduce(
            (acumulador, elemento) => acumulador + ', ' + elemento
        )}\n` +
        `${" ".repeat(this.indentacao)}})\n` +
        `})\n\n`;
    }

    private criarRotaConfirmarExclusao(declaracaoModelo: Classe): string {
        // Isso aqui não vai ficar assim. 
        // É preciso montar as partes de dados antes.
        const dadosTestes = [];
        for (const propriedade of declaracaoModelo.propriedades) {
            dadosTestes.push(`"${propriedade.nome.lexema}": "Teste"`);
        }

        return `liquido.rotaGet(funcao(requisicao, resposta) {\n` +
        `${" ".repeat(this.indentacao)}resposta.lmht("excluir", {\n` +
        `${" ".repeat(this.indentacao * 2)}${dadosTestes.reduce(
            (acumulador, elemento) => acumulador + ', ' + elemento
        )}\n` +
        `${" ".repeat(this.indentacao)}})\n` +
        `})\n\n`;
    }
}