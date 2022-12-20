import { LinconesSQLite } from '@designliquido/lincones-sqlite';

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

    resolver() {
        const lincones = new LinconesSQLite();
        return lincones;
    }
}
