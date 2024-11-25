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

        const corpo = objetoVisao.lmht?.corpo;

        if (corpo || corpo === '') {
            if (corpo.parcial || corpo.parcial === '') {
                const parcial = corpo.parcial;
                if (!parcial.nome) {
                    return new Error('Em Parcial o atributo nome não foi informado');
                }

                parcial.nome = `${parcial.nome}.lmht`;

                if (!this.buscarDiretorioOuArquivo(this.diretorioParcial)) {
                    return new Error(`O diretorio ${this.diretorioParcial} não foi encontrado`);
                }

                if (!this.buscarDiretorioOuArquivo(this.diretorioParcial, parcial.nome)) {
                    return new Error(`O arquivo ${parcial.nome} não foi encontrado`);
                }

                const caminho = path.join(this._diretorioRaizCaminho, this.diretorioParcial, parcial.nome);

                const conteudo = this.obterConteudoDoArquivoParcial(caminho);

                if (conteudo instanceof Error) {
                    return conteudo;
                }

                const xmlContent = this.construtorLmht.buildObject(conteudo);

                return { xmlContent, conteudo };
            }
            return new Error('Não foi encontrado a tag parcial');
        }
        return new Error('Não foi encontrado a tag corpo');
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
