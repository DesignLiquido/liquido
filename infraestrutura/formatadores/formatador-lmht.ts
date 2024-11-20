import * as sistemaDeArquivos from 'fs';
import * as caminho from 'path';

import Handlebars from 'handlebars';

import { ConversorLmht } from '@designliquido/lmht-js';
import { ObjetoDeleguaClasse } from '@designliquido/delegua/estruturas';
import { PreprocessadorFolEs, PreprocessadorHandlebars, PreprocessadorLmhtParciais } from '../preprocessadores';

export class FormatadorLmht {
    conversorLmht: ConversorLmht;
    diretorioBase: string;
    preprocessadorFolEs: PreprocessadorFolEs;
    preprocessadorHandlebars: PreprocessadorHandlebars;
    preprocessadorLmhtParciais: PreprocessadorLmhtParciais;
    private readonly regexParcial = /<parcial nome="([^"]+)".*?(?:\/>|><\/parcial>)/g;

    constructor(diretorioBase: string) {
        this.conversorLmht = new ConversorLmht();
        this.preprocessadorFolEs = new PreprocessadorFolEs();
        this.preprocessadorHandlebars = new PreprocessadorHandlebars();
        this.preprocessadorLmhtParciais = new PreprocessadorLmhtParciais();
        this.diretorioBase = diretorioBase;
    }

    /**
     * Aplica transformações Handlebars e LMHT no arquivo de visão correspondente
     * à rota.
     * @param caminhoRota Caminho da rota na requisição.
     * @param valores Valores que devem ser usados na aplicação do Handlebars.
     * @returns O resultado das duas conversões.
     */
    async formatar(caminhoRota: string, valores: {[nome: string]: any}): Promise<any> {
        const resolucaoVisao = this.resolverVisaoCorrespondente(caminhoRota);
        if (!resolucaoVisao.visaoCorrespondente) {
            let listaCaminhosTentados: string = 'Caminhos tentados: ';
            for (const caminhoTentado of resolucaoVisao.caminhosTentados) {
                listaCaminhosTentados += caminhoTentado + '; ';
            }

            return Promise.reject(
                `Visão correspondente à rota ${caminhoRota} não existe. ${listaCaminhosTentados}`
            );
        }

        const arquivoBase: Buffer = sistemaDeArquivos.readFileSync(resolucaoVisao.visaoCorrespondente);
        const conteudoDoArquivo: string = arquivoBase.toString();
        let textoBase = conteudoDoArquivo;

        if (valores) {
            // Preprocessamento: Parciais
            const parciaisResolvidos: string[] = [];
            let parciais: string[] = [];
            if (this.verificarEstruturaParcial(textoBase)) {
                parciais = this.devolverParciais(textoBase);
                const textoParcial = parciais.map((parcial) => {
                    return `<lmht><corpo>${parcial}</corpo></lmht>`;
                });
                textoParcial.map((parcial) => {
                    const result = this.preprocessadorLmhtParciais.processarParciais(parcial);
                    if (result instanceof Error) {
                        throw result;
                    }
                    parciaisResolvidos.push(result.conteudo);
                });
            }

            textoBase = this.formatarTextoBase(textoBase, parciais, parciaisResolvidos);

            // Preprocessamento: Handlebars
            textoBase = this.preprocessadorHandlebars.processar(textoBase);
            const template = Handlebars.compile(textoBase);
            const valoresResolvidos = this.resolverValores(valores);
            textoBase = template(valoresResolvidos);
        }

        // Preprocessamento: FolEs
        textoBase = this.preprocessadorFolEs.processar(textoBase);

        return this.conversorLmht.converterPorTexto(textoBase);
    }

    private resolverVisaoCorrespondente(
        caminhoRota: string
    ): { visaoCorrespondente: string | undefined, caminhosTentados: string[] } {
        const caminhoRotaParametrosResolvidos = caminhoRota.replace(/:([\w]+)(\/)?/i, `[$1]`);
        const diretorioOuArquivo = caminho.join(this.diretorioBase, 'visoes', caminhoRotaParametrosResolvidos);
        const retorno = {
            visaoCorrespondente: '',
            caminhosTentados: [
                diretorioOuArquivo,
                diretorioOuArquivo + '.lmht'
            ]
        }

        let visaoCorrespondente: string;
        if (caminhoRotaParametrosResolvidos.endsWith(']')) {
            // Quando o caminho termina em um símbolo de parâmetro, significa que a visão correspondente
            // é a de detalhes.
            const caminhoRotaDiretorio = caminhoRota.replace(/:([\w]+)(\/)?/i, '');
            visaoCorrespondente = caminho.join(this.diretorioBase, 'visoes', caminhoRotaDiretorio, 'detalhes.lmht');
        } else {
            visaoCorrespondente = caminho.join(this.diretorioBase, 'visoes', caminhoRotaParametrosResolvidos + '.lmht');
        }
        
        if (sistemaDeArquivos.existsSync(diretorioOuArquivo)) {
            // É diretório
            if (visaoCorrespondente.endsWith(caminho.sep + '.lmht')) {
                visaoCorrespondente = visaoCorrespondente.replace(caminho.sep + '.lmht', caminho.sep + 'inicial.lmht');
            }
        } 
        
        if (!sistemaDeArquivos.existsSync(visaoCorrespondente)) {
            // Caminho não existe.
            // Se o caminho não termina com `inicial.lmht`, testar existência. 
            // Se não existir, visão correspondente passa a ser a `inicial.lmht`.
            visaoCorrespondente = caminho.join(diretorioOuArquivo, 'inicial.lmht');
            retorno.caminhosTentados.push(visaoCorrespondente);
            if (!sistemaDeArquivos.existsSync(visaoCorrespondente)) {
                // Se ainda assim visão correspondente não existir, indefinir para erro borbulhar
                // nas chamadas superiores.
                visaoCorrespondente = undefined;
            }
        }

        retorno.visaoCorrespondente = visaoCorrespondente;
        return retorno;
    }

    /**
     * Resolve valores para o Handlebars, já que alguns objetos retornados pelo núcleo de
     * Delégua não são exatamente dicionários.
     * @param valores Os valores a serem enviados para o Handlebars.
     * @returns Todos os valores normalizados como dicionários, ou ainda dicionários de dicionários.
     */
    private resolverValores(valores: {[nome: string]: any}) {
        const valoresResolvidos = {};
        for (const [nome, valor] of Object.entries(valores)) {
            // eslint-disable-next-line no-prototype-builtins
            let valorResolvido = valor.hasOwnProperty('valor') ? valor.valor : valor;
            if (valorResolvido.constructor.name === 'ObjetoDeleguaClasse') {
                valorResolvido = this.obterPropriedadesDeObjetoComoDicionario(valorResolvido);
            }

            valoresResolvidos[nome] = valorResolvido;
        }

        return valoresResolvidos;
    }

    private obterPropriedadesDeObjetoComoDicionario(objeto: ObjetoDeleguaClasse) {
        const dicionarioPropriedades = {};
        for (const [nome, valor] of Object.entries(objeto.propriedades)) {
            dicionarioPropriedades[nome] = valor;
        }

        return dicionarioPropriedades;
    }

    private formatarTextoBase(
        textoBase: string,
        listaDeParciais: Array<string>,
        parciaisResolvidos: Array<string>
    ): string {
        for (let i = 0; i < listaDeParciais.length; i++) {
            textoBase = textoBase.replace(listaDeParciais[i], parciaisResolvidos[i]);
        }
        return textoBase;
    }

    private devolverParciais(textoLmht: string): string[] {
        return textoLmht.match(this.regexParcial).map((parcial) => {
            return parcial.toString();
        });
    }

    private verificarEstruturaParcial(textoLmht: string): boolean {
        const matches = textoLmht.match(this.regexParcial);
        return matches?.length > 0 ? true : false;
    }
}
