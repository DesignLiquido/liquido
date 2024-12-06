import caminho from 'path';
import { async as glob } from 'fast-glob';
import { Lexador, AvaliadorSintatico, ErroAvaliadorSintatico, Declaracao, Expressao, Chamada, AcessoMetodoOuPropriedade, Decorador, Literal, Vetor, Construto } from '@designliquido/delegua';
import { Importador } from '@designliquido/delegua-node/importador';

import { RotaOpenApi } from './rota-open-api';
import { MetodoHttpOpenApi } from './metodo-http-open-api';
import { RespostaOpenApi } from './resposta-open-api';
import { DocumentoOpenApi } from './documento-open-api';
import { AutoDocumentadorInterface } from '../../interfaces/auto-documentador-interface';

/**
 * O auto documentador lê o projeto e gera uma especificação OpenAPI
 * baseada no que foi implementado a nível de rotas.
 */
export class AutoDocumentador implements AutoDocumentadorInterface {
    diretorioRotas: string;
    decoradoresValidos: {[key: string]: {[key: string]: string}};
    erros: Error[];
    nomeAplicacao: string = "Teste Liquido";
    versao: string = "0.0.1";
    descricao: string = "Este é um teste em Liquido";
    nomeLicenca: string = "MIT";
    urlLicensa: string = "https://github.com/DesignLiquido/liquido/LICENSE";

    constructor() {
        this.erros = [];
        this.diretorioRotas = caminho
            .join(process.cwd(), 'rotas/rest')
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
        }
    }

    // TODO: Pensar em como fazer isso considerando importações de outros arquivos.
    protected obterEstruturasDeAltoNivelDeControlador(caminhoControlador: string): Declaracao[] {
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
            this.erros.push(new Error(
                `O controlador em ${caminhoControlador} possui erros: ${retornoImportador.retornoAvaliadorSintatico.erros.map((erro: ErroAvaliadorSintatico) => ' - ' + erro.message + '\n')}`
            ));
            return [];
        }

        return retornoImportador.retornoAvaliadorSintatico.declaracoes;
    }

    protected async encontrarControladores() {
        const formatoGlob = (this.diretorioRotas + '/**/*.delegua').replace(/\\/gi, '/');
        const arquivos = await glob([formatoGlob], {
            dot: true,
            absolute: false,
            stats: false,
        });
    
        const controladores = [];
        for (const caminhoArquivo of arquivos) {
            const estruturas = this.obterEstruturasDeAltoNivelDeControlador(caminhoArquivo);
            const rotaEControlador = this.lerControlador(caminhoArquivo, estruturas);
            controladores.push(rotaEControlador);
        }
    
        return controladores;
    }

    protected resolverConstrutoValorDecorador(construtoValor: Construto): any {
        switch (construtoValor.constructor.name) {
            case 'Literal':
                return (construtoValor as Literal).valor;
            case 'Vetor':
                const valoresResolvidos = [];
                for (const valor of (construtoValor as Vetor).valores) {
                    valoresResolvidos.push(this.resolverConstrutoValorDecorador(valor));
                }
                
                return valoresResolvidos;
        }
    }

    protected resolverAtributosDecorador(decorador: Decorador): Record<string, any> {
        const decoradorResolvido: Record<string, any> = {};
        for (const [nomeAtributo, valorAtributo] of Object.entries(decorador.atributos)) {
            decoradorResolvido[nomeAtributo] = this.resolverConstrutoValorDecorador(valorAtributo);
        }

        return decoradorResolvido;
    }

    
    protected resolverDecoradorDocumentacao(atributos: Record<string, any>): RotaOpenApi {
        const retorno: RotaOpenApi = {};
        const decoradoresValidosDocumentacao = this.decoradoresValidos['@rest.documentacao'];
        for (const [nomeAtributo, valorAtributo] of Object.entries(atributos)) {
            retorno[decoradoresValidosDocumentacao[nomeAtributo]] = valorAtributo;
        }

        return retorno;
    }

    protected resolverDecoradorResposta(atributos: Record<string, any>): any {
        const decoradoresValidosResposta = this.decoradoresValidos['@rest.resposta'];
        if (!('codigo' in atributos) && !('código' in atributos)) {
            this.erros.push(new Error(`Decorador @rest.resposta não possui atributo obrigado 'código' ou 'codigo'.`));
            return null;
        }

        const codigo = atributos['codigo'] || atributos['código'];
        const retorno: RespostaOpenApi = {};
        for (const [nomeAtributo, valorAtributo] of Object.entries(atributos)) {
            retorno[decoradoresValidosResposta[nomeAtributo]] = valorAtributo;
        }

        delete retorno['statusCode'];
        return [codigo, retorno];
    }

    protected resolverDecorador(decorador: Decorador): any {
        if (!(decorador.nome in this.decoradoresValidos)) {
            this.erros.push(new Error(`Decorador ${decorador.nome} não é válido para um método de um controlador.`));
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
    protected lerControlador(caminhoControlador: string, declaracoes: Declaracao[]): [string, {[key in MetodoHttpOpenApi]?: RotaOpenApi}] {
        this.erros = [];
        const descritivoControlador: {[key in MetodoHttpOpenApi]?: RotaOpenApi} = {};
        const rotaRelativa = caminhoControlador
            .replace(this.diretorioRotas, '')
            .replace('inicial.delegua', '')
            .replace('.delegua', '');

        // console.log('rotaRelativa', rotaRelativa);

        for (const declaracao of declaracoes) {
            // Os decoradores contêm a documentação adicional para uma rota.
            const decoradores = declaracao.decoradores;
            // Aqui normalmente teremos uma expressão com uma chamada dentro.
            const chamada = (declaracao as Expressao).expressao as Chamada;
            // Tipicamente, a entidade chamada é uma variável com o nome reservado `liquido`.
            // o método é um Símbolo. 
            // A execução e middlewares ficam em argumentos.
            const entidadeChamada = chamada.entidadeChamada as AcessoMetodoOuPropriedade;
            // const argumentos = chamada.argumentos;
            // console.log(decoradores, argumentos, entidadeChamada.objeto, entidadeChamada.simbolo);

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

            const metodoResolvido = entidadeChamada.simbolo.lexema.replace('rota', '');
            descritivoControlador[metodoResolvido.toLowerCase()] = descritivoMetodoRota;
        }

        return [rotaRelativa, descritivoControlador];
    }
    
    async documentar() {
        const rotasEControladores = await this.encontrarControladores();
        const documento: DocumentoOpenApi = {
            openapi: '3.0.0',
            servers: [],
            info: {
                "description": this.descricao,
                "version": this.versao,
                "title": this.nomeAplicacao,
                "license": {
                    "name": this.nomeLicenca,
                    "url": this.urlLicensa
                }
            },
            paths: {}
        };

        for (const rotaEControlador of rotasEControladores) {
            documento.paths[rotaEControlador[0]] = rotaEControlador[1];
        }

        // console.log(documento);
        return documento;
    }
}