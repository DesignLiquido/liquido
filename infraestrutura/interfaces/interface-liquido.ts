import { Importador, Interpretador } from "@designliquido/delegua";
import { Construto } from "@designliquido/delegua/fontes/construtos";
import { ConversorLmht } from "@designliquido/lmht-js";
import { Roteador } from "../../roteador";

export interface LiquidoInterface {
  importador: Importador;
  interpretador: Interpretador;
  conversorLmht: ConversorLmht;
  roteador: Roteador;
  arquivosDelegua: Array<string>;
  rotasDelegua: Array<string>;
  diretorioBase: string;
  diretorioDescobertos: string[];

  iniciar(): Promise<void>;
  descobrirRotas(diretorio: string): void;
  resolverCaminhoRota(caminhoArquivo: string): string;
  importarArquivosRotas(): void;
  adicionarRotaGet(caminhoRota: string, argumentos: Construto[]): void;
  adicionarRotaPost(caminhoRota: string, argumentos: Construto[]): void;
  adicionarRotaPut(caminhoRota: string, argumentos: Construto[]): void;
  adicionarRotaDelete(caminhoRota: string, argumentos: Construto[]): void;
  adicionarRotaPatch(caminhoRota: string, argumentos: Construto[]): void;
}
