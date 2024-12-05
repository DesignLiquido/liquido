import { ConfiguracaoComum } from "./configuracao-comum";

export class ConfiguracaoRoteador extends ConfiguracaoComum {
    diretorioEstatico?: string = undefined;
    cors: boolean = false;
    bodyParser: boolean = true;
    morgan: boolean = false;
    cookieParser: boolean = true;
    passport: boolean = false;
    json: boolean = true;
    helmet: boolean = true;

    constructor(valoresIniciais?: Partial<ConfiguracaoRoteador>) {
        super();
        Object.assign(this, valoresIniciais);
    }
}
