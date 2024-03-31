import { DeleguaModulo } from '@designliquido/delegua/estruturas';

export interface ProvedorInterface {
    configurar(nome: string, valor: string): void;
    get configurado(): boolean;
    resolver(): Promise<DeleguaModulo>;
}