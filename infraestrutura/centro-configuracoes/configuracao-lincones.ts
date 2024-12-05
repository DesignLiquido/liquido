import { ConfiguracaoComum } from "./configuracao-comum";

export class ConfiguracaoLincones extends ConfiguracaoComum {
    tecnologia?: string = undefined;
    caminho?: string = undefined;

    constructor(valoresIniciais?: Partial<ConfiguracaoLincones>) {
        super();
        Object.assign(this, valoresIniciais);
    }
}
