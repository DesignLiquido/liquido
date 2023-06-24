import * as sistemaDeArquivos from 'fs';
import * as caminho from 'path';

import Handlebars from 'handlebars';

import { ConversorLmht } from '@designliquido/lmht-js';
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
    async formatar(caminhoRota: string, valores: any): Promise<any> {
        let visaoCorrespondente: string = caminho.join(this.diretorioBase, 'visoes', caminhoRota, '.lmht');
        const diretorioOuArquivo = caminho.join(this.diretorioBase, 'visoes', caminhoRota);
        if (sistemaDeArquivos.existsSync(diretorioOuArquivo)) {
            // É diretório
            if (visaoCorrespondente.endsWith(caminho.sep + '.lmht')) {
                visaoCorrespondente = visaoCorrespondente.replace(caminho.sep + '.lmht', caminho.sep + 'inicial.lmht');
            }
        } else if (sistemaDeArquivos.existsSync(diretorioOuArquivo + '.lmht')) {
            // É arquivo
            visaoCorrespondente = visaoCorrespondente.replace(caminho.sep + '.lmht', '.lmht');
        } else {
            // Caminho não existe
            return Promise.reject(
                `Visão correspondente à rota ${caminhoRota} não existe. Caminhos tentados: ${diretorioOuArquivo}, ${
                    diretorioOuArquivo + '.lmht'
                }`
            );
        }

        const arquivoBase: Buffer = sistemaDeArquivos.readFileSync(visaoCorrespondente);
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
            textoBase = template(valores);
        }

        // Preprocessamento: FolEs
        textoBase = this.preprocessadorFolEs.processar(textoBase);

        return await this.conversorLmht.converterPorTexto(textoBase);
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
