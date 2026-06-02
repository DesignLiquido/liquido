import { AspectoConfiguracaoInterface } from "./aspecto-configuracao-interface";
import { ErroConfiguracao } from "./erro-configuracao";

export abstract class ConfiguracaoComum implements AspectoConfiguracaoInterface {
    abstract configurar(componentes: {[key: string]: any}): void;

    definirValor(instancia: AspectoConfiguracaoInterface, caminho: string[], valor: any): void {
        caminho.shift();
        if (caminho.length === 1) {
            if (!(caminho[0] in instancia)) {
                throw new ErroConfiguracao(`Propriedade ${caminho[0]} não existe em ${instancia.constructor.name}.`);
            }

            (instancia as any)[caminho[0]] = valor;
            return;
        }

        const proximaPropriedade = caminho[0];
        if (!(proximaPropriedade in instancia)) {
            throw new ErroConfiguracao(`Propriedade ${proximaPropriedade} não existe em ${instancia.constructor.name}.`);
        }

        (instancia as any)[proximaPropriedade].definirValor((instancia as any)[proximaPropriedade], caminho, valor);
    }
}
