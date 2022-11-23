import {
  ErroAvaliadorSintatico,
  Importador,
  Interpretador,
} from "@designliquido/delegua";
import { Construto } from "@designliquido/delegua/fontes/construtos";
import { ErroLexador } from "@designliquido/delegua/fontes/lexador/erro-lexador";
import { ConversorLmht } from "@designliquido/lmht-js";
import { Roteador } from "../infraestrutura/roteador";

export interface LiquidoInterface {
  importador: Importador;
  interpretador: Interpretador;
  conversorLmht: ConversorLmht;
  roteador: Roteador;
  arquivosDelegua: Array<string>;
  rotasDelegua: Array<string>;
  diretorioBase: string;
  diretorioDescobertos: string[];

  errosLexador: Array<ErroLexadorLiquido>;
  errosAvaliadorSintatico: Array<ErroAvaliadorSintatico>;

  iniciar(): Promise<void>;
  descobrirRotas(diretorio: string): void;
  resolverCaminhoRota(caminhoArquivo: string): string;
  importarArquivosRotas(): void;
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

export interface ErroLexadorLiquido {
  erro: ErroLexador;
  arquivo: string;
}
