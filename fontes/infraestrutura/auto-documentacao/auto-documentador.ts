import caminho from 'path';
import { async as glob } from 'fast-glob';

import {
    Lexador,
    ErroAvaliadorSintatico,
    Declaracao,
    Expressao,
    Chamada,
    AcessoMetodo,
    AcessoMetodoOuPropriedade,
    Decorador,
    Literal,
    Vetor,
    ConstrutoInterface
} from '@designliquido/delegua';
import { LexadorPitugues } from '@designliquido/delegua/lexador';
import { Importador } from '@designliquido/delegua-node/importador';
import {
    AvaliadorSintaticoComImportacao
} from '@designliquido/delegua-node/avaliador-sintatico/avaliador-sintatico-com-importacao';

import { RotaOpenApi } from './rota-open-api';
import { MetodoHttpOpenApi } from './metodo-http-open-api';
import { RespostaOpenApi } from './resposta-open-api';
import { DocumentoOpenApi } from './documento-open-api';
import {
    AutoDocumentadorInterface
} from '../../interfaces/auto-documentador-interface';

/**
 * O auto documentador lê o projeto e gera uma especificação OpenAPI
 * baseada no que foi implementado a nível de rotas.
 */
export class AutoDocumentador implements AutoDocumentadorInterface {
    diretorioRotas: string;
    decoradoresValidos: { [key: string]: { [key: string]: string } };
    erros: Error[];
    nomeAplicacao: string = 'Teste Liquido';
    versao: string = '0.0.1';
    descricao: string = 'Este é um teste em Liquido';
    nomeLicenca: string = 'MIT';
    urlLicensa: string = 'https://github.com/DesignLiquido/liquido/LICENSE';

    constructor() {
        this.erros = [];
        this.diretorioRotas = caminho
            .join(process.cwd(), 'rotas')
            .replace(/\\/gi, '/');

        this.decoradoresValidos = {
            '@rest.documentacao': {
                sumario: 'summary',
                sumário: 'summary',
                descricao: 'description',
                descrição: 'description',
                idOperacao: 'operationId',
                idOperação: 'operationId',
                etiquetas: 'tags'
            },
            '@rest.resposta': {
                codigo: 'statusCode',
                código: 'statusCode',
                descricao: 'description',
                descrição: 'description',
                formatos: 'content'
            }
        };
    }

    // TODO: Pensar em como fazer isso considerando importações de outros arquivos.
    protected async obterEstruturasDeAltoNivelDeControlador(
        caminhoControlador: string
    ): Promise<Declaracao[]> {
        const arquivosAbertos = {};
        const conteudoArquivosAbertos = {};

        const lexador = caminhoControlador.endsWith('.pitu')
            ? new LexadorPitugues()
            : new Lexador();

        const importador = new Importador(lexador, arquivosAbertos, conteudoArquivosAbertos, false);

        const avaliadorSintatico = new AvaliadorSintaticoComImportacao(importador);

        const retornoImportador = importador.importar(caminhoControlador, -1);
        const retornoAvaliadorSintatico = await avaliadorSintatico.analisar(retornoImportador.retornoLexador, retornoImportador.hashArquivo);
        if (retornoAvaliadorSintatico.erros.length > 0) {
            this.erros.push(
                new Error(
                    `O controlador em ${caminhoControlador} possui erros: ${retornoAvaliadorSintatico.erros.map((erro: ErroAvaliadorSintatico) => ' - ' + erro.message + '\n')}`
                )
            );
            return [];
        }

        return retornoAvaliadorSintatico.declaracoes;
    }

    protected async encontrarControladores() {
        const formatoGlob = (
            this.diretorioRotas + '/**/*.{delegua,pitu}'
        ).replace(/\\/gi, '/');
        const arquivos = await glob(
            [formatoGlob],
            { dot: true, absolute: false, stats: false }
        );

        const controladores = [];

        for (const caminhoArquivo of arquivos) {
            const estruturas = await this
                .obterEstruturasDeAltoNivelDeControlador(caminhoArquivo);
            const rotaEControlador = this.lerControlador(
                caminhoArquivo,
                estruturas
            );

            controladores.push(rotaEControlador);
        }

        return controladores;
    }

    protected resolverConstrutoValorDecorador(
        construtoValor: ConstrutoInterface
    ): any {
        switch (construtoValor.constructor.name) {
            case 'Literal':
                return (construtoValor as Literal).valor;
            case 'Vetor':
                const valoresResolvidos = [];

                for (const valor of (construtoValor as Vetor).valores) {
                    valoresResolvidos.push(
                        this.resolverConstrutoValorDecorador(valor)
                    );
                }

                return valoresResolvidos;
        }
    }

    protected resolverAtributosDecorador(
        decorador: Decorador
    ): Record<string, any> {
        const decoradorResolvido: Record<string, any> = {};

        for (const [nomeAtributo, valorAtributo] of Object.entries(decorador.atributos)) {
            decoradorResolvido[nomeAtributo] = this.resolverConstrutoValorDecorador(valorAtributo);
        }

        return decoradorResolvido;
    }

    protected resolverDecoradorDocumentacao(
        atributos: Record<string, any>
    ): RotaOpenApi {
        const retorno: RotaOpenApi = {};
        const decoradoresValidosDocumentacao = this.decoradoresValidos['@rest.documentacao'];

        for (const [nomeAtributo, valorAtributo] of Object.entries(atributos)) {
            retorno[decoradoresValidosDocumentacao[nomeAtributo] as keyof RotaOpenApi] = valorAtributo;
        }

        return retorno;
    }

    protected resolverDecoradorResposta(atributos: Record<string, any>): any {
        const decoradoresValidosResposta = this.decoradoresValidos['@rest.resposta'];

        if (!('codigo' in atributos) && !('código' in atributos)) {
            this.erros.push(new Error(
                `Decorador @rest.resposta não possui atributo obrigado 'código' ou 'codigo'.`
            ));

            return null;
        }

        const codigo = atributos['codigo'] || atributos['código'];
        const retorno: RespostaOpenApi = {};

        for (const [nomeAtributo, valorAtributo] of Object.entries(atributos)) {
            const nomeOpenApi = decoradoresValidosResposta[nomeAtributo];
            if (nomeOpenApi === 'statusCode') continue;

            if (nomeOpenApi === 'content') {
                retorno.content = valorAtributo;
                continue;
            }

            (retorno as Record<string, any>)[nomeOpenApi] = valorAtributo;
        }

        return [codigo, retorno];
    }

    protected resolverDecorador(decorador: Decorador): any {
        if (!(decorador.nome in this.decoradoresValidos)) {
            this.erros.push(new Error(
                `Decorador ${decorador.nome} não é válido para um método de um controlador.`
            ));

            return null;
        }

        const atributos = this.resolverAtributosDecorador(decorador);
        switch (decorador.nome) {
            case '@rest.documentacao':
                return this.resolverDecoradorDocumentacao(atributos);
            case '@rest.resposta':
                return this.resolverDecoradorResposta(atributos);
        }
    }

    /**
     * Para cada declaração vinda de um controlador, o que se espera são um
     * vetor de expressões, sendo cada expressão contendo pelo menos uma chamada
     * a um dos métodos de Liquido. Normalmente, esses métodos são `rotaGet`, `rotaPost`,
     * etc.
     * @param caminhoControlador O caminho original do arquivo controlador.
     * @param declaracoes As declarações implementadas no arquivo controlador.
     * @returns O descritivo do controlador, ou seja, as rotas e seus respectivos métodos.
     */
    protected lerControlador(
        caminhoControlador: string,
        declaracoes: Declaracao[]
    ): [string, { [key in MetodoHttpOpenApi]?: RotaOpenApi }] {
        const descritivoControlador: { [key in MetodoHttpOpenApi]?: RotaOpenApi } = {};

        // Remove o prefixo do diretório de rotas e a extensão do arquivo
        // para obter o caminho relativo da rota
        let rotaRelativa = caminhoControlador.substring(
            this.diretorioRotas.length
        );

        rotaRelativa = rotaRelativa.replace(/inicial\.(delegua|pitu)$/, '');
        rotaRelativa = rotaRelativa.replace(/\.(delegua|pitu)$/, '');
        rotaRelativa = rotaRelativa.replace(/\[(.+?)\]/g, '{$1}');

        for (const declaracao of declaracoes) {
            if (!(declaracao instanceof Expressao)) continue;

            const expressao = declaracao.expressao;

            if (!(expressao instanceof Chamada)) continue;

            const chamada = expressao;
            const decoradores = declaracao.decoradores;

            // Extrai o nome do método (rotaGet, rotaPost, ...) suportando
            // AcessoMetodo (Delégua) e AcessoMetodoOuPropriedade (Pituguês)
            let nomeMetodo: string | null = null;
            const entidadeChamada = chamada.entidadeChamada;

            if (entidadeChamada instanceof AcessoMetodo) {
                nomeMetodo = entidadeChamada.nomeMetodo;
            } else if (entidadeChamada instanceof AcessoMetodoOuPropriedade) {
                nomeMetodo = entidadeChamada.simbolo.lexema;
            }

            if (!nomeMetodo) continue;

            let descritivoMetodoRota: RotaOpenApi = {};
            for (const decorador of decoradores) {
                const decoradorResolvido = this.resolverDecorador(decorador);
                if (Array.isArray(decoradorResolvido)) {
                    // Resposta
                    if (!descritivoMetodoRota.responses) {
                        descritivoMetodoRota.responses = {};
                    }

                    descritivoMetodoRota.responses[decoradorResolvido[0]] = decoradorResolvido[1];
                } else {
                    descritivoMetodoRota = Object.assign(descritivoMetodoRota, decoradorResolvido);
                }
            }

            const metodoResolvido = nomeMetodo.replace('rota', '');

            descritivoControlador[metodoResolvido.toLowerCase() as MetodoHttpOpenApi] = descritivoMetodoRota;
        }

        return [rotaRelativa, descritivoControlador];
    }

    async documentar() {
        this.erros = [];
        const rotasEControladores = await this.encontrarControladores();
        const documento: DocumentoOpenApi = {
            openapi: '3.0.0',
            servers: [],
            info: {
                description: this.descricao,
                version: this.versao,
                title: this.nomeAplicacao,
                license: { name: this.nomeLicenca, url: this.urlLicensa }
            },
            paths: {}
        };

        for (const rotaEControlador of rotasEControladores) {
            documento.paths![rotaEControlador[0]] = rotaEControlador[1];
        }

        // console.log(documento);
        return documento;
    }
}
