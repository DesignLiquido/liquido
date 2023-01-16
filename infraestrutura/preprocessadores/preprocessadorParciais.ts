import { XMLParser } from "fast-xml-parser";

export class PreprocessadorParciais {
    constructor(private readonly leitorLmht: XMLParser) {}

    public processarParciais(texto: string): string {
        const objetoVisao = this.leitorLmht.parse(texto);
        // TODO: @ItaloCobains Verificar qual o objeto correto de parciais.
        const parciais = objetoVisao.lmht?.parciais;

        if (parciais) {
            // TODO: @ItaloCobains Implementar a lógica de processamento de parciais.
        }
        // TODO: @ItaloCobains Retornar o texto processado.
        return ''
    }
}