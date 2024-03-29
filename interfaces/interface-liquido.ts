import { RetornoInterpretador } from '@designliquido/delegua/fontes/interfaces/retornos';
import { Importador } from '@designliquido/delegua-node/fontes/importador';
import { Construto, FuncaoConstruto } from '@designliquido/delegua/fontes/construtos';
import { Interpretador } from '@designliquido/delegua-node/fontes/interpretador';

import { Roteador } from '../infraestrutura/roteador';
import { RetornoMiddleware } from './retorno-middleware';

export interface LiquidoInterface {
    importador: Importador;
    interpretador: Interpretador;
    roteador: Roteador;
    arquivosDelegua: string[];
    rotasDelegua: string[];
    diretorioBase: string;
    diretorioDescobertos: string[];
    diretorioEstatico: string;

    iniciar(): Promise<void>;
    descobrirRotas(diretorio: string): void;
    resolverCaminhoRota(caminhoArquivo: string): string;
    importarArquivosRotas(): void;
    importarArquivoConfiguracao(): void;
    resolverArquivoConfiguracao(caminhoTotal?: string): RetornoMiddleware;
    prepararRequisicao(requisicao: any, nomeFuncao: string, funcaoConstruto: FuncaoConstruto): void;

    chamarInterpretador(nomeFuncao: string): Promise<RetornoInterpretador>;
    adicionarRota(metodoRoteador: string, caminhoRota: string, argumentos: Construto[]): void;
}
