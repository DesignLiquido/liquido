export interface AspectoConfiguracaoInterface {
    configurar(componentes: {[key: string]: any}): void;
    definirValor(instancia: AspectoConfiguracaoInterface, caminho: string[], valor: any): void;
}