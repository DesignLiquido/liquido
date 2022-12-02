import * as caminho from 'path';
import * as sistemaDeArquivos from 'node:fs';

import Handlebars from 'handlebars';

import { ConversorLmht } from "@designliquido/lmht-js";
import { PreprocessadorFolEs } from '../preprocessadores';

export class FormatadorLmht {
    conversorLmht: ConversorLmht;
    diretorioBase: string;
    preprocessadorFolEs: PreprocessadorFolEs;

    constructor(diretorioBase: string) {
        this.conversorLmht = new ConversorLmht();
        this.preprocessadorFolEs = new PreprocessadorFolEs();
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
        let visaoCorrespondente = caminho.join(this.diretorioBase, "visoes", caminhoRota, ".lmht");
        if (visaoCorrespondente.endsWith(caminho.sep + ".lmht")) {
            visaoCorrespondente = visaoCorrespondente.replace(caminho.sep + ".lmht", caminho.sep + "inicial.lmht");
        }

        const arquivoBase: Buffer = sistemaDeArquivos.readFileSync(visaoCorrespondente);
        const conteudoDoArquivo: string = arquivoBase.toString();
        let textoBase = conteudoDoArquivo;

        if (valores) {
            const template = Handlebars.compile(conteudoDoArquivo);
            textoBase = template(valores);
        }

        // Preprocessamento: FolEs
        textoBase = this.preprocessadorFolEs.processarFolhasEstilo(textoBase);

        return await this.conversorLmht.converterPorTexto(textoBase);
    }
}