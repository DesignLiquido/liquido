import { Importador } from '@designliquido/delegua-node/importador';
import { Construto, FuncaoConstruto } from '@designliquido/delegua/construtos';
import { InterpretadorInterface, RetornoInterpretadorInterface } from '@designliquido/delegua/interfaces';

import { Roteador } from '../infraestrutura/roteador';
import { RetornoConfiguracaoInterface } from './retorno-configuracao-interface';

export interface LiquidoInterface {
    importador: Importador | undefined;
    interpretador: InterpretadorInterface | undefined;
    roteador: Roteador;
    arquivosDelegua: string[];
    rotasDelegua: string[];
    diretorioBase: string;
    diretorioDescobertos: string[];
    diretorioEstatico: string;

    iniciar(): Promise<void>;
    descobrirRotas(diretorio: string, linguagem: string): void;
    resolverCaminhoRota(caminhoArquivo: string, linguagem: string): string;
    importarArquivosRotas(): void;
    importarArquivoConfiguracao(): void;
    resolverArquivoConfiguracao(caminhoTotal?: string): RetornoConfiguracaoInterface;
    prepararRequisicao(requisicao: any, nomeFuncao: string, funcaoConstruto: FuncaoConstruto): void;

    chamarInterpretador(nomeFuncao: string): Promise<RetornoInterpretadorInterface>;
    adicionarRota(metodoRoteador: string, caminhoRota: string, argumentos: Construto[]): void;
}
