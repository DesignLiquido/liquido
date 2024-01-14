import * as sistemaArquivos from 'fs';
import * as caminho from 'path';

import { Classe } from '@designliquido/delegua/fontes/declaracoes';
import { pluralizar } from '@designliquido/flexoes';
import { criarDiretorioSeNaoExiste } from '.';

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
     * @param {Classe} declaracaoModelo O nome do diretório das rotas: o nome do modelo no plural.
     * @returns {string} O caminho completo onde os arquivos de rotas foram criados.
     */
    criarNovasRotas(declaracaoModelo: Classe): string {
        const nomeBaseModelo = declaracaoModelo.simbolo.lexema.toLocaleLowerCase('pt');
        const nomeModeloPlural = pluralizar(nomeBaseModelo).toLocaleLowerCase('pt');
        const diretorioRotas = caminho.join(process.cwd(), 'rotas', nomeModeloPlural);

        const conteudoSelecionarTudo = this.criarRotaSelecionarTudo(declaracaoModelo);
        const conteudoAdicionar = `liquido.rotaPost(funcao(requisicao, resposta) {\n    resposta.lmht({ "titulo": "Liquido" })\n})\n\n`;
        const conteudoAtualizar = `liquido.rotaPut(funcao(requisicao, resposta) {\n    resposta.lmht({ "titulo": "Liquido" })\n})\n\n`;
        const conteudoExcluir = `liquido.rotaDelete(funcao(requisicao, resposta) {\n    resposta.lmht({ "titulo": "Liquido" })\n})\n\n`;
        const conteudoControlador = `${conteudoSelecionarTudo}${conteudoAdicionar}${conteudoAtualizar}${conteudoExcluir}`;

        criarDiretorioSeNaoExiste('rotas', nomeModeloPlural);
        const caminhoRotas = caminho.join(diretorioRotas, 'inicial.delegua');
        sistemaArquivos.writeFileSync(
            caminhoRotas, 
            conteudoControlador
        );

        return caminhoRotas;
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
}