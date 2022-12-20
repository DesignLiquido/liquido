export interface ProvedorInterface {
    configurar(nome: string, valor: string): void;
    get configurado(): boolean;
    resolver(): any;
}