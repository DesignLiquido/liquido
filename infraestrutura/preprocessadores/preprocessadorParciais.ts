import { XMLBuilder, XMLParser } from "fast-xml-parser";

export class PreprocessadorParciais {
    private readonly leitorLmht: XMLParser;
    private readonly construtorLmht: XMLBuilder
    constructor() {
        this.construtorLmht = new XMLBuilder({});
        this.leitorLmht = new XMLParser();
    }

    public processarParciais(texto: string): string {
        const objetoVisao = this.leitorLmht.parse(texto);

        const corpo = objetoVisao.lmht?.corpo;

        if (corpo) {
            const parcial = corpo.parcial;
            if (parcial) {
                // TODO: @ItaloCobains Implementar o processamento de parciais.
            }
        }

        // const xmlContent = this.construtorLmht.build(objetoVisao);
        return corpo;
    }
}