import { XMLBuilder, XMLParser } from "fast-xml-parser";

import * as fs from 'fs';
import path from "path";

export class PreprocessadorParciais {
    private readonly leitorLmht: XMLParser;
    private readonly construtorLmht: XMLBuilder
    private readonly DiretorioParcial = "parciais";
    private readonly DiretorioRaizCaminho = process.cwd();
    private readonly opcoesLeitorLmht = {
        ignoreAttributes: false,
        attributeNamePrefix : ""
    }

    constructor() {
        this.leitorLmht = new XMLParser(this.opcoesLeitorLmht);
        this.construtorLmht = new XMLBuilder({});
    }

    public processarParciais(texto: string): string | Error {
        const objetoVisao = this.leitorLmht.parse(texto);

        const corpo = objetoVisao.lmht?.corpo;

        if (corpo) {
            const parcial = corpo.parcial;
            if (parcial) {
                if (!parcial.nome) {
                    return new Error("Em Parcial o atributo nome não foi informado");
                }

                if (!this.buscaDiretorioOuArquivo(this.DiretorioParcial)) {
                    return new Error(`O diretorio ${this.DiretorioParcial} não foi encontrado`);
                }

                if (!this.buscaDiretorioOuArquivo(this.DiretorioParcial, parcial.nome)) {
                    return new Error(`O arquivo ${parcial.nome} não foi encontrado`);
                }

            }
            return new Error("Não foi encontrado a tag parcial")
        }

        return corpo;
    }


    private  buscaDiretorioOuArquivo(directory: string, file?: string) {
        let files: string[] = [];

        file = file ? `${file}.lmht` : file;

        if (!file) {
            if (!fs.existsSync(directory)) {
                return new Error(`O diretorio ${directory} não foi encontrado`);
            }
            return true
        }

        try {
            files = fs.readdirSync(path.join(this.DiretorioRaizCaminho, directory))

            if(file) {
                files = files.filter(f => f.includes(file));
            }
        } catch (err) {
            console.error(err);
            return new Error(err);
        }
        return [files, true];
    }


}