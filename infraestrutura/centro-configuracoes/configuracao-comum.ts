import { AspectoConfiguracaoInterface } from "./aspecto-configuracao-interface";
import { ErroConfiguracao } from "./erro-configuracao";

export abstract class ConfiguracaoComum implements AspectoConfiguracaoInterface {
    definirValor(instancia: AspectoConfiguracaoInterface, caminho: string[], valor: any): void {
        caminho.shift();
        if (caminho.length === 1) {
            if (!instancia.hasOwnProperty(caminho[0])) {
                throw new ErroConfiguracao(`Propriedade ${caminho[0]} não existe em ${instancia.constructor.name}.`);
            }

            instancia[caminho[0]] = valor;
            return;
        }

        const proximaPropriedade = caminho[0];
        if (!instancia.hasOwnProperty(proximaPropriedade)) {
            throw new ErroConfiguracao(`Propriedade ${proximaPropriedade} não existe em ${instancia[proximaPropriedade].constructor.name}.`);
        }

        instancia[proximaPropriedade].definirValor(instancia[proximaPropriedade], caminho, valor);
    }
}
