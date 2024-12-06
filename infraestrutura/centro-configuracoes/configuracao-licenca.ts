import { AutoDocumentadorInterface } from "../../interfaces/auto-documentador-interface";
import { ConfiguracaoComum } from "./configuracao-comum";

export class ConfiguracaoLicenca extends ConfiguracaoComum {
    nome?: string = undefined;
    url?: string = undefined;

    constructor(valoresIniciais?: Partial<ConfiguracaoLicenca>) {
        super();
        Object.assign(this, valoresIniciais);
    }

    configurar(componentes: {[key: string]: any}) {
        const autoDocumentador = componentes['autoDocumentador'] as AutoDocumentadorInterface;
        if (this.nome) {
            autoDocumentador.nomeLicenca = this.nome;
        }

        if (this.url) {
            autoDocumentador.urlLicensa = this.url;
        }
    }
}
