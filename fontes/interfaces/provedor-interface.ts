import { DeleguaModulo } from '@designliquido/delegua/interpretador/estruturas';

export interface ProvedorInterface {
    configurar(nome: string, valor: string | undefined): void;
    get configurado(): boolean;
    resolver(): Promise<DeleguaModulo>;
}
