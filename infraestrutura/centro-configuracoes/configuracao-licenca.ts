import { ConfiguracaoComum } from "./configuracao-comum";

export class ConfiguracaoLicenca extends ConfiguracaoComum {
    nome?: string = undefined;
    url?: string = undefined;

    constructor(valoresIniciais?: Partial<ConfiguracaoLicenca>) {
        super();
        Object.assign(this, valoresIniciais);
    }
}
