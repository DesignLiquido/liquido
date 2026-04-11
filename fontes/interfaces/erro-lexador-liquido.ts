import { ErroLexador } from '@designliquido/delegua/lexador/erro-lexador';

export interface ErroLexadorLiquido {
    erro: ErroLexador;
    arquivo: string;
}
