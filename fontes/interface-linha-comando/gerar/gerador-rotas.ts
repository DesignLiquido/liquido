import * as sistemaArquivos from 'fs';
import * as caminho from 'path';

import { Classe, PropriedadeClasse } from '@designliquido/delegua/declaracoes';
import { pluralizar } from '@designliquido/flexoes';
import { criarDiretorioComIdSeNaoExiste, criarDiretorioSeNaoExiste } from '.';

export class GeradorRotas {
    indentacao: number;
    private motor: 'lincones' | 'delegua-entidades' | 'pitugues';

    constructor(motor: 'lincones' | 'delegua-entidades' | 'pitugues' = 'lincones') {
        this.indentacao = 4;
        this.motor = motor;
    }

    /**
     * Cria arquivos de rota no diretório 'rotas/<modelo no plural>' com cinco rotas.
     * A extensão dos arquivos é `.delegua` (motores `lincones` e `delegua-entidades`)
     * ou `.pitu` (motor `pitugues`):
     * - Arquivo `inicial.<ext>`
     *     - rotaGet (selecionar todos os registros)
     *     - rotaPost (gravar 1 registro)
     * - Arquivo `novo.<ext>`
     *     - rotaGet (exibir formulário para novo registro)
     * - Arquivo `[id]/inicial.<ext>`
     *     - rotaGet (selecionar 1 registro por id)
     * - Arquivo `[id]/editar.<ext>`
     *     - rotaGet (carregar dados para edição)
     *     - rotaPost (alterar 1 registro)
     * - Arquivo `[id]/excluir.<ext>`
     *     - rotaGet (confirmar exclusão)
     *     - rotaPost (excluir 1 registro)
     * @param {Classe} declaracaoModelo O descritor do modelo, com suas propriedades.
     * @returns {string[]} Os caminhos completos onde os arquivos de rotas foram criados.
     */
    criarNovasRotas(declaracaoModelo: Classe): string[] {
        const nomeBaseModelo = declaracaoModelo.simbolo.lexema.toLocaleLowerCase('pt');
        const nomeModeloPlural = pluralizar(nomeBaseModelo).toLocaleLowerCase('pt');
        const diretorioRotas = caminho.join(process.cwd(), 'rotas', nomeModeloPlural);

        criarDiretorioSeNaoExiste('rotas', nomeModeloPlural);

        const rotasCriadas: string[] = [];
        rotasCriadas.push(this.criarNovasRotasSemId(declaracaoModelo, diretorioRotas));
        rotasCriadas.push(this.criarNovaRotaFormularioNovo(diretorioRotas));
        rotasCriadas.push(...this.criarNovasRotasComId(declaracaoModelo, diretorioRotas));
        return rotasCriadas;
    }

    private criarNovasRotasSemId(declaracaoModelo: Classe, diretorioRotas: string): string {
        const caminhoRotas = caminho.join(diretorioRotas, `inicial${this.extensao}`);
        sistemaArquivos.writeFileSync(caminhoRotas, this.criarConteudoInicialSemId(declaracaoModelo));
        return caminhoRotas;
    }

    private criarNovaRotaFormularioNovo(diretorioRotas: string): string {
        const caminhoRota = caminho.join(diretorioRotas, `novo${this.extensao}`);
        sistemaArquivos.writeFileSync(caminhoRota, this.criarConteudoFormularioNovo());
        return caminhoRota;
    }

    private criarNovasRotasComId(declaracaoModelo: Classe, diretorioRotas: string): string[] {
        const diretorioRotasComId = criarDiretorioComIdSeNaoExiste(diretorioRotas);

        const caminhoRotasId = caminho.join(diretorioRotasComId, `inicial${this.extensao}`);
        sistemaArquivos.writeFileSync(caminhoRotasId, this.criarConteudoInicialComId(declaracaoModelo));

        const caminhoRotaEditar = caminho.join(diretorioRotasComId, `editar${this.extensao}`);
        sistemaArquivos.writeFileSync(caminhoRotaEditar, this.criarConteudoEditar(declaracaoModelo));

        const caminhoRotaExcluir = caminho.join(diretorioRotasComId, `excluir${this.extensao}`);
        sistemaArquivos.writeFileSync(caminhoRotaExcluir, this.criarConteudoExcluir(declaracaoModelo));

        return [caminhoRotasId, caminhoRotaEditar, caminhoRotaExcluir];
    }

    private obterNomeChave(modelo: Classe): string {
        for (const propriedade of modelo.propriedades) {
            if (propriedade.decoradores.some(d => d.nome === '@chave')) {
                return propriedade.nome.lexema;
            }
        }
        for (const propriedade of modelo.propriedades) {
            if (propriedade.nome.lexema === 'id') return 'id';
        }
        return 'id';
    }

    private obterCamposNaoChave(modelo: Classe): PropriedadeClasse[] {
        const nomeChave = this.obterNomeChave(modelo);
        return modelo.propriedades.filter(p => p.nome.lexema !== nomeChave);
    }

    private get extensao(): string {
        return this.motor === 'pitugues' ? '.pitu' : '.delegua';
    }

    private i(nivel: number = 1): string {
        return ' '.repeat(this.indentacao * nivel);
    }

    private criarConteudoInicialSemId(declaracaoModelo: Classe): string {
        const nomeModelo = declaracaoModelo.simbolo.lexema;
        const nomeModeloPlural = pluralizar(nomeModelo.toLocaleLowerCase('pt'));

        if (this.motor === 'delegua-entidades') {
            const rotaGet =
                `liquido.rotaGet(funcao(requisicao, resposta) {\n` +
                `${this.i()}var colecao = contexto.colecao(${nomeModelo})\n` +
                `${this.i()}var resultados = colecao.todos()\n` +
                `${this.i()}resposta.lmht({"linhas": resultados}).status(200)\n` +
                `})\n\n`;
            const rotaPost =
                `liquido.rotaPost(funcao(requisicao, resposta) {\n` +
                `${this.i()}var corpo = requisicao.corpo\n` +
                `${this.i()}var colecao = contexto.colecao(${nomeModelo})\n` +
                `${this.i()}colecao.salvar(corpo)\n` +
                `${this.i()}resposta.redirecionar("/${nomeModeloPlural}")\n` +
                `})\n\n`;
            return rotaGet + rotaPost;
        }

        // LinConEs
        const campos = this.obterCamposNaoChave(declaracaoModelo);
        const colunas = campos.map(p => p.nome.lexema).join(', ');
        const placeholders = campos.map(() => '?').join(', ');
        const valoresInserir = campos.map(p => `corpo.${p.nome.lexema}`).join(', ');

        if (this.motor === 'pitugues') {
            const rotaGet =
                `funcao rota_get(requisicao, resposta):\n` +
                `${this.i()}resultados = lincones.executar("SELECIONAR * DE ${nomeModeloPlural}")\n` +
                `${this.i()}resposta.lmht({"linhas": resultados[0].linhasRetornadas}).status(200)\n\n`;
            const rotaPost =
                `funcao rota_post(requisicao, resposta):\n` +
                `${this.i()}corpo = requisicao.corpo\n` +
                `${this.i()}lincones.executar("INSERIR EM ${nomeModeloPlural} (${colunas}) VALORES (${placeholders})", [${valoresInserir}])\n` +
                `${this.i()}resposta.redirecionar("/${nomeModeloPlural}")\n\n`;
            return rotaGet + rotaPost +
                `liquido.rotaGet(rota_get)\n` +
                `liquido.rotaPost(rota_post)\n`;
        }

        const rotaGet =
            `liquido.rotaGet(funcao(requisicao, resposta) {\n` +
            `${this.i()}var resultados = lincones.executar("SELECIONAR * DE ${nomeModeloPlural}")\n` +
            `${this.i()}resposta.lmht({"linhas": resultados[0].linhasRetornadas}).status(200)\n` +
            `})\n\n`;
        const rotaPost =
            `liquido.rotaPost(funcao(requisicao, resposta) {\n` +
            `${this.i()}var corpo = requisicao.corpo\n` +
            `${this.i()}lincones.executar("INSERIR EM ${nomeModeloPlural} (${colunas}) VALORES (${placeholders})", [${valoresInserir}])\n` +
            `${this.i()}resposta.redirecionar("/${nomeModeloPlural}")\n` +
            `})\n\n`;
        return rotaGet + rotaPost;
    }

    private criarConteudoFormularioNovo(): string {
        if (this.motor === 'delegua-entidades' || this.motor === 'lincones') {
            return `liquido.rotaGet(funcao(requisicao, resposta) {\n` +
                `${this.i()}resposta.lmht("adicionar", {}).status(200)\n` +
                `})\n`;
        }

        // Pituguês
        return `funcao rota_get(requisicao, resposta):\n` +
            `${this.i()}resposta.lmht("adicionar", {}).status(200)\n\n` +
            `liquido.rotaGet(rota_get)\n`;
    }

    private criarConteudoInicialComId(declaracaoModelo: Classe): string {
        const nomeModelo = declaracaoModelo.simbolo.lexema;
        const nomeModeloPlural = pluralizar(nomeModelo.toLocaleLowerCase('pt'));
        const nomeSingular = nomeModelo.toLocaleLowerCase('pt');
        const nomeChave = this.obterNomeChave(declaracaoModelo);

        if (this.motor === 'delegua-entidades') {
            return `liquido.rotaGet(funcao(requisicao, resposta) {\n` +
                `${this.i()}var colecao = contexto.colecao(${nomeModelo})\n` +
                `${this.i()}var registro = colecao.buscarPorId(requisicao.parametros.${nomeChave})\n` +
                `${this.i()}se (registro == nulo) {\n` +
                `${this.i(2)}resposta.status(404)\n` +
                `${this.i()}} senao {\n` +
                `${this.i(2)}resposta.lmht("detalhes", {"${nomeSingular}": registro}).status(200)\n` +
                `${this.i()}}\n` +
                `})\n\n`;
        }

        // LinConEs
        if (this.motor === 'pitugues') {
            return `funcao rota_get(requisicao, resposta):\n` +
                `${this.i()}resultados = lincones.executar("SELECIONAR * DE ${nomeModeloPlural} ONDE ${nomeChave} = ?", [requisicao.parametros.${nomeChave}])\n` +
                `${this.i()}se resultados[0].linhasRetornadas.comprimento > 0:\n` +
                `${this.i(2)}resposta.lmht("detalhes", {"${nomeSingular}": resultados[0].linhasRetornadas[0]}).status(200)\n` +
                `${this.i()}senao:\n` +
                `${this.i(2)}resposta.status(404)\n\n` +
                `liquido.rotaGet(rota_get)\n`;
        }

        return `liquido.rotaGet(funcao(requisicao, resposta) {\n` +
            `${this.i()}var resultados = lincones.executar("SELECIONAR * DE ${nomeModeloPlural} ONDE ${nomeChave} = ?", [requisicao.parametros.${nomeChave}])\n` +
            `${this.i()}se (resultados[0].linhasRetornadas.comprimento > 0) {\n` +
            `${this.i(2)}resposta.lmht("detalhes", {"${nomeSingular}": resultados[0].linhasRetornadas[0]}).status(200)\n` +
            `${this.i()}} senao {\n` +
            `${this.i(2)}resposta.status(404)\n` +
            `${this.i()}}\n` +
            `})\n\n`;
    }

    private criarConteudoEditar(declaracaoModelo: Classe): string {
        const nomeModelo = declaracaoModelo.simbolo.lexema;
        const nomeModeloPlural = pluralizar(nomeModelo.toLocaleLowerCase('pt'));
        const nomeSingular = nomeModelo.toLocaleLowerCase('pt');
        const nomeChave = this.obterNomeChave(declaracaoModelo);

        if (this.motor === 'delegua-entidades') {
            const rotaGet =
                `liquido.rotaGet(funcao(requisicao, resposta) {\n` +
                `${this.i()}var colecao = contexto.colecao(${nomeModelo})\n` +
                `${this.i()}var registro = colecao.buscarPorId(requisicao.parametros.${nomeChave})\n` +
                `${this.i()}se (registro == nulo) {\n` +
                `${this.i(2)}resposta.status(404)\n` +
                `${this.i()}} senao {\n` +
                `${this.i(2)}resposta.lmht("editar", {"${nomeSingular}": registro}).status(200)\n` +
                `${this.i()}}\n` +
                `})\n\n`;
            const rotaPost =
                `liquido.rotaPost(funcao(requisicao, resposta) {\n` +
                `${this.i()}var corpo = requisicao.corpo\n` +
                `${this.i()}var colecao = contexto.colecao(${nomeModelo})\n` +
                `${this.i()}colecao.modificar(corpo)\n` +
                `${this.i()}resposta.redirecionar("/${nomeModeloPlural}")\n` +
                `})\n\n`;
            return rotaGet + rotaPost;
        }

        // LinConEs
        const campos = this.obterCamposNaoChave(declaracaoModelo);
        const definir = campos.map(p => `${p.nome.lexema} = ?`).join(', ');
        const valoresAtualizar = [
            ...campos.map(p => `corpo.${p.nome.lexema}`),
            `requisicao.parametros.${nomeChave}`
        ].join(', ');

        if (this.motor === 'pitugues') {
            const rotaGet =
                `funcao rota_get(requisicao, resposta):\n` +
                `${this.i()}resultados = lincones.executar("SELECIONAR * DE ${nomeModeloPlural} ONDE ${nomeChave} = ?", [requisicao.parametros.${nomeChave}])\n` +
                `${this.i()}se resultados[0].linhasRetornadas.comprimento > 0:\n` +
                `${this.i(2)}resposta.lmht("editar", {"${nomeSingular}": resultados[0].linhasRetornadas[0]}).status(200)\n` +
                `${this.i()}senao:\n` +
                `${this.i(2)}resposta.status(404)\n\n`;
            const rotaPost =
                `funcao rota_post(requisicao, resposta):\n` +
                `${this.i()}corpo = requisicao.corpo\n` +
                `${this.i()}lincones.executar("ATUALIZAR ${nomeModeloPlural} DEFINIR ${definir} ONDE ${nomeChave} = ?", [${valoresAtualizar}])\n` +
                `${this.i()}resposta.redirecionar("/${nomeModeloPlural}")\n\n`;
            return rotaGet + rotaPost +
                `liquido.rotaGet(rota_get)\n` +
                `liquido.rotaPost(rota_post)\n`;
        }

        const rotaGet =
            `liquido.rotaGet(funcao(requisicao, resposta) {\n` +
            `${this.i()}var resultados = lincones.executar("SELECIONAR * DE ${nomeModeloPlural} ONDE ${nomeChave} = ?", [requisicao.parametros.${nomeChave}])\n` +
            `${this.i()}se (resultados[0].linhasRetornadas.comprimento > 0) {\n` +
            `${this.i(2)}resposta.lmht("editar", {"${nomeSingular}": resultados[0].linhasRetornadas[0]}).status(200)\n` +
            `${this.i()}} senao {\n` +
            `${this.i(2)}resposta.status(404)\n` +
            `${this.i()}}\n` +
            `})\n\n`;
        const rotaPost =
            `liquido.rotaPost(funcao(requisicao, resposta) {\n` +
            `${this.i()}var corpo = requisicao.corpo\n` +
            `${this.i()}lincones.executar("ATUALIZAR ${nomeModeloPlural} DEFINIR ${definir} ONDE ${nomeChave} = ?", [${valoresAtualizar}])\n` +
            `${this.i()}resposta.redirecionar("/${nomeModeloPlural}")\n` +
            `})\n\n`;
        return rotaGet + rotaPost;
    }

    private criarConteudoExcluir(declaracaoModelo: Classe): string {
        const nomeModelo = declaracaoModelo.simbolo.lexema;
        const nomeModeloPlural = pluralizar(nomeModelo.toLocaleLowerCase('pt'));
        const nomeSingular = nomeModelo.toLocaleLowerCase('pt');
        const nomeChave = this.obterNomeChave(declaracaoModelo);

        if (this.motor === 'delegua-entidades') {
            const rotaGet =
                `liquido.rotaGet(funcao(requisicao, resposta) {\n` +
                `${this.i()}var colecao = contexto.colecao(${nomeModelo})\n` +
                `${this.i()}var registro = colecao.buscarPorId(requisicao.parametros.${nomeChave})\n` +
                `${this.i()}se (registro == nulo) {\n` +
                `${this.i(2)}resposta.status(404)\n` +
                `${this.i()}} senao {\n` +
                `${this.i(2)}resposta.lmht("excluir", {"${nomeSingular}": registro}).status(200)\n` +
                `${this.i()}}\n` +
                `})\n\n`;
            const rotaPost =
                `liquido.rotaPost(funcao(requisicao, resposta) {\n` +
                `${this.i()}var colecao = contexto.colecao(${nomeModelo})\n` +
                `${this.i()}colecao.remover(requisicao.parametros.${nomeChave})\n` +
                `${this.i()}resposta.redirecionar("/${nomeModeloPlural}")\n` +
                `})\n\n`;
            return rotaGet + rotaPost;
        }

        // LinConEs
        if (this.motor === 'pitugues') {
            const rotaGet =
                `funcao rota_get(requisicao, resposta):\n` +
                `${this.i()}resultados = lincones.executar("SELECIONAR * DE ${nomeModeloPlural} ONDE ${nomeChave} = ?", [requisicao.parametros.${nomeChave}])\n` +
                `${this.i()}se resultados[0].linhasRetornadas.comprimento > 0:\n` +
                `${this.i(2)}resposta.lmht("excluir", {"${nomeSingular}": resultados[0].linhasRetornadas[0]}).status(200)\n` +
                `${this.i()}senao:\n` +
                `${this.i(2)}resposta.status(404)\n\n`;
            const rotaPost =
                `funcao rota_post(requisicao, resposta):\n` +
                `${this.i()}lincones.executar("EXCLUIR EM ${nomeModeloPlural} ONDE ${nomeChave} = ?", [requisicao.parametros.${nomeChave}])\n` +
                `${this.i()}resposta.redirecionar("/${nomeModeloPlural}")\n\n`;
            return rotaGet + rotaPost +
                `liquido.rotaGet(rota_get)\n` +
                `liquido.rotaPost(rota_post)\n`;
        }

        const rotaGet =
            `liquido.rotaGet(funcao(requisicao, resposta) {\n` +
            `${this.i()}var resultados = lincones.executar("SELECIONAR * DE ${nomeModeloPlural} ONDE ${nomeChave} = ?", [requisicao.parametros.${nomeChave}])\n` +
            `${this.i()}se (resultados[0].linhasRetornadas.comprimento > 0) {\n` +
            `${this.i(2)}resposta.lmht("excluir", {"${nomeSingular}": resultados[0].linhasRetornadas[0]}).status(200)\n` +
            `${this.i()}} senao {\n` +
            `${this.i(2)}resposta.status(404)\n` +
            `${this.i()}}\n` +
            `})\n\n`;
        const rotaPost =
            `liquido.rotaPost(funcao(requisicao, resposta) {\n` +
            `${this.i()}lincones.executar("EXCLUIR EM ${nomeModeloPlural} ONDE ${nomeChave} = ?", [requisicao.parametros.${nomeChave}])\n` +
            `${this.i()}resposta.redirecionar("/${nomeModeloPlural}")\n` +
            `})\n\n`;
        return rotaGet + rotaPost;
    }
}
