import { ConfiguracaoComum } from "./configuracao-comum";

export class ConfiguracaoEstilos extends ConfiguracaoComum {
    diretorioBase: string = 'publico/css';

    constructor(valoresIniciais?: Partial<ConfiguracaoEstilos>) {
        super();
        Object.assign(this, valoresIniciais);
    }

    configurar(_componentes: {[key: string]: any}) {
        // Sem efeito colateral direto: diretorioBase é lido por Liquido para
        // escrever o CSS gerado por FolEs e para configurar o Express.
    }
}
