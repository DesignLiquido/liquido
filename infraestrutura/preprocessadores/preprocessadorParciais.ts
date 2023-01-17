import { XMLBuilder, XMLParser } from "fast-xml-parser";
import fs from 'fs';
import * as path from 'path';

export class PreprocessadorParciais {
    private readonly leitorLmht: XMLParser;
    private readonly construtorLmht: XMLBuilder
    private readonly DiretorioParcial = "parciais";
    private readonly DiretorioRaizCaminho = process.cwd();

    constructor() {
        this.construtorLmht = new XMLBuilder({});
        this.leitorLmht = new XMLParser();
    }

    private VerificaAtributoParcial(DiretorioParcial: string): boolean {
        return fs.existsSync(path.join(this.DiretorioRaizCaminho, DiretorioParcial));
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
                    return new Error(`O arquivo ${parcial.nome} não foi encontrado no diretorio ${this.DiretorioParcial}`);
                }

                //TODO: @ItaloCobains - Implementar sintax de execução do parcial

            }
            return new Error("Não foi encontrado a tag parcial")
        }

        // const xmlContent = this.construtorLmht.build(objetoVisao);
        return corpo;
    }
}