import { ProvedorInterface } from "../../interfaces/provedor-interface";
import { ConfiguracaoComum } from "./configuracao-comum";
import { ErroConfiguracao } from "./erro-configuracao";

export class ConfiguracaoLincones extends ConfiguracaoComum {
    tecnologia?: string = undefined;
    caminho?: string = undefined;
    autoInicializar: boolean = false;
    arquivoInicializacao: string = 'inicializacao.lincones';

    constructor(valoresIniciais?: Partial<ConfiguracaoLincones>) {
        super();
        Object.assign(this, valoresIniciais);
    }

    configurar(componentes: {[key: string]: any}) {
        const tecnologiaAusente = !this.tecnologia;
        const caminhoAusente = !this.caminho;

        if (tecnologiaAusente !== caminhoAusente) {
            const chaveAusente = tecnologiaAusente
                ? 'liquido.dados.lincones.tecnologia'
                : 'liquido.dados.lincones.caminho';
            throw new ErroConfiguracao(
                `Configuração incompleta: ${chaveAusente} não informado. `
                + `Defina ambas as propriedades "liquido.dados.lincones.tecnologia" e "liquido.dados.lincones.caminho" no arquivo configuracao.delprops, `
                + `ou remova ambas se não for usar banco de dados.`
            );
        }

        if (tecnologiaAusente && caminhoAusente) {
            return;
        }

        const provedorLincones = componentes['provedorLincones'] as ProvedorInterface;
        provedorLincones.configurar('tecnologia', this.tecnologia);
        provedorLincones.configurar('caminho', this.caminho);
    }
}
