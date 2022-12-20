import { DeleguaModulo } from '@designliquido/delegua/fontes/estruturas';

export interface ProvedorInterface {
    configurar(nome: string, valor: string): void;
    get configurado(): boolean;
    resolver(): DeleguaModulo;
}