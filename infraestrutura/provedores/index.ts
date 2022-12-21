import { LinconesSQLite } from '@designliquido/lincones-sqlite';
import { DeleguaModulo, FuncaoPadrao } from '@designliquido/delegua/fontes/estruturas';

import { ProvedorInterface } from "../../interfaces/provedor-interface";

export class ProvedorLincones implements ProvedorInterface {
    tecnologia: string;
    caminho: string;

    constructor() {
        this.tecnologia = "";
        this.caminho = "";
    }

    configurar(nome: string, valor: string): void {
        switch (nome) {
            case 'tecnologia':
                this.tecnologia = valor;
                break;
            case 'caminho':
                this.caminho = valor;
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
        const lincones = new LinconesSQLite();
        await lincones.clienteSQLite.abrir();
        const linconesComoModulo = new DeleguaModulo('lincones');
        linconesComoModulo.componentes['executar'] = 
            new FuncaoPadrao(lincones.executar.length, lincones.executar.bind(lincones));

        return linconesComoModulo;
    }
}
