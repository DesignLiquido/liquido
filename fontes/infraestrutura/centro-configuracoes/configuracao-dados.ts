import { ConfiguracaoComum } from "./configuracao-comum";
import { ConfiguracaoLincones } from "./configuracao-lincones";

export class ConfiguracaoDados extends ConfiguracaoComum {
    motor: 'lincones' | 'delegua-entidades' = 'lincones';
    autoInicializar: boolean = false;
    arquivoInicializacao: string = 'inicializacao.lincones';
    lincones: ConfiguracaoLincones;

    constructor() {
        super();
        this.lincones = new ConfiguracaoLincones();
    }

    configurar(componentes: {[key: string]: any}) {
        this.lincones.configurar(componentes);
    }
}
