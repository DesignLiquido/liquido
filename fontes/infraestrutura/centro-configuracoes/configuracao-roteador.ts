import { RoteadorInterface } from "../../interfaces/roteador-interface";
import { ConfiguracaoComum } from "./configuracao-comum";

export class ConfiguracaoRoteador extends ConfiguracaoComum {
    diretorioEstatico: string = 'publico';
    cors: boolean = false;
    origensCors: string | string[] = '*';
    bodyParser: boolean = true;
    morgan: boolean = false;
    cookieParser: boolean = true;
    passport: boolean = false;
    json: boolean = true;
    helmet: boolean = true;
    porta: number = 3000;
    constructor(valoresIniciais?: Partial<ConfiguracaoRoteador>) {
        super();
        Object.assign(this, valoresIniciais);
    }

    configurar(componentes: {[key: string]: any}) {
        const roteador = componentes['roteador'] as RoteadorInterface;
        roteador.ativarDesativarBodyParser(this.bodyParser);
        roteador.ativarDesativarCors(this.cors);
        roteador.configurarOrigensCors(this.origensCors);
        roteador.ativarDesativarCookieParser(this.cookieParser);
        roteador.ativarDesativarExpressJson(this.json);
        roteador.ativarDesativarHelmet(this.helmet);
        roteador.ativarDesativarMorgan(this.morgan);
        roteador.ativarDesativarPassport(this.passport);
        roteador.configurarPorta(this.porta);
        // Nota: configurarArquivosEstaticos é chamado em liquido.ts com caminho absoluto
    }
}
