import { parseString, Builder } from 'xml2js';

import * as fs from 'fs';
import path from 'path';

export class PreprocessadorLmhtParciais {
    private readonly construtorLmht: Builder;
    private readonly _diretorioParcial = 'visoes/parciais';
    private readonly _diretorioRaizCaminho = process.cwd();

    constructor() {
        this.construtorLmht = new Builder({});
    }

    get diretorioParcial(): string {
        return this._diretorioParcial;
    }

    public processarParciais(texto: string) {
        let objetoVisao;
        parseString(texto, (_, resultado) => {
            objetoVisao = resultado;
        });

        const corpos = objetoVisao.lmht?.corpo;
        if (!corpos || corpos.length === 0) {
            return new Error('Não foi encontrada uma estrutura de corpo para a parcial.');
        }

        const corpo = corpos[0];
        const parciais = corpo.parcial;
        if (!parciais || parciais.length === 0) {
            return new Error('Não foi encontrada uma estrutura parcial.');
        }

        const parcial = parciais[0];
        if (!parcial.$.nome) {
            return new Error('Na estrutura parcial, o atributo \'nome\' não foi informado.');
        }

        parcial.nomeResolvido = `${parcial.$.nome}.lmht`;

        if (!this.buscarDiretorioOuArquivo(this.diretorioParcial)) {
            return new Error(`O diretório '${this.diretorioParcial}' não foi encontrado.`);
        }

        if (!this.buscarDiretorioOuArquivo(this.diretorioParcial, parcial.nomeResolvido)) {
            return new Error(`O arquivo '${parcial.nomeResolvido}' não foi encontrado.`);
        }

        const caminho = path.join(this._diretorioRaizCaminho, this.diretorioParcial, parcial.nomeResolvido);
        const conteudo = this.obterConteudoDoArquivoParcial(caminho);

        if (conteudo instanceof Error) {
            return conteudo;
        }

        const xmlContent = this.construtorLmht.buildObject(conteudo);

        return { xmlContent, conteudo };  
    }

    private obterConteudoDoArquivoParcial(caminho: string): string | Error {
        let conteudo: string = '';
        try {
            conteudo = fs.readFileSync(caminho, 'utf8');
        } catch (err) {
            return new Error(err);
        }
        return conteudo;
    }

    private buscarDiretorioOuArquivo(directory: string, file?: string) {
        let files: string[] = [];

        if (!file) {
            if (!fs.existsSync(directory)) {
                return false;
            }
            return true;
        }

        try {
            files = fs.readdirSync(path.join(this._diretorioRaizCaminho, directory));

            if (file) {
                files = files.filter((f) => f.includes(file));
            }
        } catch (err) {
            console.error(err);
            return false;
        }

        if (files.length === 0) {
            return false;
        }

        return true;
    }
}
