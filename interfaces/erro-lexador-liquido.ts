import { ErroLexador } from '@designliquido/delegua/fontes/lexador/erro-lexador';

export interface ErroLexadorLiquido {
    erro: ErroLexador;
    arquivo: string;
}
