import { XMLBuilder, XMLParser } from "fast-xml-parser";
import fs from 'fs';
import * as path from 'path';

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

                if (!this.VerificaAtributoParcial(this.DiretorioParcial)) {
                    return new Error(`O diretorio ${this.DiretorioParcial} não foi encontrado`);
                }

                if (!this.VerificaArquivoParcialEmDiretorio(parcial.nome)) {
                    return new Error(`O arquivo ${parcial.nome} não foi encontrado`);
                }

            }
            return new Error("Não foi encontrado a tag parcial")
        }

        return corpo;
    }

    private VerificaArquivoParcialEmDiretorio(nomeArquivo: string): boolean {
        nomeArquivo = `${nomeArquivo}.lmht`;
        return fs.existsSync(path.join(this.DiretorioRaizCaminho, this.DiretorioParcial, nomeArquivo))
    }

    private VerificaAtributoParcial(DiretorioParcial: string): boolean {
        return fs.existsSync(path.join(this.DiretorioRaizCaminho, DiretorioParcial));
    }
}