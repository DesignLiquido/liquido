import { ErroAvaliadorSintatico } from "@designliquido/delegua";
import { ErroLexador } from "@designliquido/delegua/fontes/lexador/erro-lexador";
import { ConversorLmht } from "@designliquido/lmht-js";
import express, { NextFunction, Request, Response } from "express";

export class Roteador {
  aplicacao: express.Express;
  porta: number;
  conversorLmht: ConversorLmht;

  errosLexador: ErroLexador[] = [];
  errosAvaliadorSintatico: ErroAvaliadorSintatico[] = [];

  constructor(conversorLmht: ConversorLmht) {
    this.aplicacao = express();
    this.porta = 3000;
    this.conversorLmht = conversorLmht;
    this.middlewares();
  }

  middlewares() {
    this.aplicacao.use(
      (err: any, req: Request, res: Response, next: NextFunction) => {
        if (err) {
          console.error(err);
          throw new Error("Error: " + err.message);
        }
        if (this.errosLexador.length > 0) {
          throw new Error(
            `Error: ${this.errosLexador[0].mensagem} : ${this.errosLexador[0].linha}`
          );
        }
        if (this.errosAvaliadorSintatico.length > 0) {
          throw new Error(`Error: ${this.errosAvaliadorSintatico[0].message}`);
        }
        return next();
      }
    );
  }

  rotaGet(caminho: string, execucao: (req: Request, res: Response) => void) {
    this.aplicacao.get(caminho, execucao);
  }

  rotaPost(caminho: string, execucao: (req: Request, res: Response) => void) {
    this.aplicacao.post(caminho, execucao);
  }

  rotaPut(caminho: string, execucao: (req: Request, res: Response) => void) {
    this.aplicacao.put(caminho, execucao);
  }

  rotaPatch(caminho: string, execucao: (req: Request, res: Response) => void) {
    this.aplicacao.patch(caminho, execucao);
  }

  rotaDelete(caminho: string, execucao: (req: Request, res: Response) => void) {
    this.aplicacao.delete(caminho, execucao);
  }

  rotaOptions(
    caminho: string,
    execucao: (req: Request, res: Response) => void
  ) {
    this.aplicacao.options(caminho, execucao);
  }

  rotaCopy(caminho: string, execucao: (req: Request, res: Response) => void) {
    this.aplicacao.copy(caminho, execucao);
  }

  rotaHead(caminho: string, execucao: (req: Request, res: Response) => void) {
    this.aplicacao.head(caminho, execucao);
  }

  rotaLock(caminho: string, execucao: (req: Request, res: Response) => void) {
    this.aplicacao.lock(caminho, execucao);
  }

  rotaUnlock(caminho: string, execucao: (req: Request, res: Response) => void) {
    this.aplicacao.unlock(caminho, execucao);
  }

  rotaPurge(caminho: string, execucao: (req: Request, res: Response) => void) {
    this.aplicacao.purge(caminho, execucao);
  }

  rotaPropfind(
    caminho: string,
    execucao: (req: Request, res: Response) => void
  ) {
    this.aplicacao.propfind(caminho, execucao);
  }

  iniciar() {
    this.aplicacao.listen(this.porta, () => {
      console.log(`Aplicação iniciada na porta ${this.porta}`);
    });
  }
}
