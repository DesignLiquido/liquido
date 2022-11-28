import {
    ErroAvaliadorSintatico,
    Importador,
    Interpretador,
    RetornoImportador,
    RetornoInterpretador
} from '@designliquido/delegua';
import { Construto, FuncaoConstruto } from '@designliquido/delegua/fontes/construtos';
import { ErroLexador } from '@designliquido/delegua/fontes/lexador/erro-lexador';
import { Roteador } from '../infraestrutura/roteador';

export interface LiquidoInterface {
    importador: Importador;
    interpretador: Interpretador;
    roteador: Roteador;
    arquivosDelegua: string[];
    rotasDelegua: string[];
    diretorioBase: string;
    diretorioDescobertos: string[];

    iniciar(): Promise<void>;
    descobrirRotas(diretorio: string): void;
    resolverCaminhoRota(caminhoArquivo: string): string;
    importarArquivosRotas(): void;
    importarArquivoMiddleware(): void;
    resolverArquivoConfiguracao(caminhoTotal?: string): RetornoMiddleware;
    prepararRequisicao(requisicao: any, nomeFuncao: string, funcaoConstruto: FuncaoConstruto): void;

    chamarInterpretador(nomeFuncao: string): Promise<RetornoInterpretador>;
    adicionarRotaGet(caminhoRota: string, argumentos: Construto[]): void;
    adicionarRotaPost(caminhoRota: string, argumentos: Construto[]): void;
    adicionarRotaPut(caminhoRota: string, argumentos: Construto[]): void;
    adicionarRotaDelete(caminhoRota: string, argumentos: Construto[]): void;
    adicionarRotaPatch(caminhoRota: string, argumentos: Construto[]): void;
    adicionarRotaOptions(caminhoRota: string, argumentos: Construto[]): void;
    adicionarRotaCopy(caminhoRota: string, argumentos: Construto[]): void;
    adicionarRotaHead(caminhoRota: string, argumentos: Construto[]): void;
    adicionarRotaLock(caminhoRota: string, argumentos: Construto[]): void;
    adicionarRotaUnlock(caminhoRota: string, argumentos: Construto[]): void;
    adicionarRotaPurge(caminhoRota: string, argumentos: Construto[]): void;
    adicionarRotaPropfind(caminhoRota: string, argumentos: Construto[]): void;
}

export interface RetornoMiddleware {
    caminho: string;
    valor: boolean;
}

export interface ErroLexadorLiquido {
    erro: ErroLexador;
    arquivo: string;
}
