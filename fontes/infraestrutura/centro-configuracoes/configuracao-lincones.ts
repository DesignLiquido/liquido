import { ProvedorInterface } from "../../interfaces/provedor-interface";
import { ConfiguracaoComum } from "./configuracao-comum";

export class ConfiguracaoLincones extends ConfiguracaoComum {
    tecnologia?: string = undefined;
    caminho?: string = undefined;

    constructor(valoresIniciais?: Partial<ConfiguracaoLincones>) {
        super();
        Object.assign(this, valoresIniciais);
    }

    configurar(componentes: {[key: string]: any}) {
        const provedorLincones = componentes['provedorLincones'] as ProvedorInterface;
        provedorLincones.configurar('tecnologia', this.tecnologia);
        provedorLincones.configurar('caminho', this.caminho);
    }
}
