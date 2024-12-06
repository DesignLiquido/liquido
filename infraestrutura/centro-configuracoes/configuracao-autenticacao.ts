import { RoteadorInterface } from "interfaces/roteador-interface";
import { ConfiguracaoComum } from "./configuracao-comum";

export class ConfiguracaoAutenticacao extends ConfiguracaoComum {
    tecnologia?: string = undefined;

    constructor() {
        super();
    }

    configurar(componentes: {[key: string]: any}) {
        const roteador = componentes['roteador'] as RoteadorInterface;
        if (this.tecnologia) {
            switch (this.tecnologia) {
                case 'jwt':
                    roteador.ativarDesativarPassport(true);
                    break;
                default:
                    console.error('Tecnologia de autenticação não suportada.');
            }
        }
    }
}
