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

    get DiretorioParcialGetter(): string {
        return this.DiretorioParcial;
    }

    public processarParciais(texto: string): string | Error {
        const objetoVisao = this.leitorLmht.parse(texto);

        const corpo = objetoVisao.lmht?.corpo;

        if (corpo || corpo === "") {
            if (corpo.parcial || corpo.parcial === "") {
                const parcial = corpo.parcial;
                if (!parcial.nome) {
                    return new Error("Em Parcial o atributo nome não foi informado");
                }

                parcial.nome = `${parcial.nome}.lmht`

                if (!this.buscaDiretorioOuArquivo(this.DiretorioParcialGetter)) {
                    return new Error(`O diretorio ${this.DiretorioParcialGetter} não foi encontrado`);
                }

                if (!this.buscaDiretorioOuArquivo(this.DiretorioParcialGetter, parcial.nome)) {
                    return new Error(`O arquivo ${parcial.nome} não foi encontrado`);
                }

                const caminho = path.join(this.DiretorioRaizCaminho, this.DiretorioParcialGetter, parcial.nome);

                const xmlContent = this.construtorLmht.build(this.ConteudoDoArquivoParcial(caminho));

                return xmlContent;

            }
            return new Error("Não foi encontrado a tag parcial")
        }
        return new Error("Não foi encontrado a tag corpo")
    }

    private ConteudoDoArquivoParcial(caminho: string): string | Error {
        let conteudo: string = "";
        try {
            conteudo = fs.readFileSync(caminho, 'utf8');
        } catch(err) {
            return new Error(err);
        }
        return conteudo;
    }

    private  buscaDiretorioOuArquivo(directory: string, file?: string) {
        let files: string[] = [];

        if (!file) {
            if (!fs.existsSync(directory)) {
                return false
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
            return false
        }

        if (files.length === 0) {
            return false
        }

        return true
    }


}