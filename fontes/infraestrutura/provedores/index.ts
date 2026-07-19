import { DeleguaModulo, FuncaoPadrao } from '@designliquido/delegua/interpretador/estruturas';
import { TecnologiaLinconesInterface } from '@designliquido/lincones-sqlite/fontes/comum/fontes';

import { ProvedorInterface } from "../../interfaces/provedor-interface";

type ConstrutorTecnologiaLincones = new () => TecnologiaLinconesInterface;

export class ProvedorLincones implements ProvedorInterface {
    tecnologia: string;
    caminho: string;
    instancia?: TecnologiaLinconesInterface;

    constructor() {
        this.tecnologia = "";
        this.caminho = "";
    }

    configurar(nome: string, valor: string): void {
        switch (nome) {
            case 'tecnologia':
                this.tecnologia = valor || "";
                break;
            case 'caminho':
                this.caminho = valor || "";
                break;
        }
    }

    get configurado(): boolean {
        return this.tecnologia !== "" && this.caminho !== "";
    }

    /**
     * Instancia classe resolvida e a mapeia como um módulo de Delégua.
     * @returns 
     */
    async resolver(): Promise<DeleguaModulo> {
        const moduloTecnologiaLincones = await import(`@designliquido/lincones-${this.tecnologia}`);
        const tecnologiaLincones = moduloTecnologiaLincones.default as ConstrutorTecnologiaLincones;
        
        const lincones = new tecnologiaLincones();
        await lincones.iniciar(this.caminho);
        this.instancia = lincones;
        const linconesComoModulo = new DeleguaModulo('lincones');
        linconesComoModulo.componentes['executar'] = 
            new FuncaoPadrao(lincones.executar.length, lincones.executar.bind(lincones));
        linconesComoModulo.componentes['executarComando'] =
            new FuncaoPadrao(lincones.executarComando.length, lincones.executarComando.bind(lincones));
        console.info(`Lincones iniciado. Tecnologia: ${this.tecnologia}; Caminho: ${this.caminho}.`);
        return linconesComoModulo;
    }
}
