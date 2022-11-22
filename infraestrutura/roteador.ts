import { ConversorLmht } from "@designliquido/lmht-js";
import express from "express";

export class Roteador {
  aplicacao: express.Express;
  porta: number;
  conversorLmht: ConversorLmht;

  constructor(conversorLmht: ConversorLmht) {
    this.aplicacao = express();
    this.porta = 3000;
    this.conversorLmht = conversorLmht;
  }

  rotaGet(caminho: string, execucao: (req: any, res: any) => void) {
    this.aplicacao.get(caminho, execucao);
  }

  rotaPost(caminho: string, execucao: (req: any, res: any) => void) {
    this.aplicacao.post(caminho, execucao);
  }

  rotaPut(caminho: string, execucao: (req: any, res: any) => void) {
    this.aplicacao.put(caminho, execucao);
  }

  rotaPatch(caminho: string, execucao: (req: any, res: any) => void) {
    this.aplicacao.patch(caminho, execucao);
  }

  rotaDelete(caminho: string, execucao: (req: any, res: any) => void) {
    this.aplicacao.delete(caminho, execucao);
  }

  // TODO
  /* 
  this.aplicacao.options(caminho, execucao);
  this.aplicacao.copy(caminho, execucao);
  this.aplicacao.head(caminho, execucao);
  this.aplicacao.lock(caminho, execucao);
  this.aplicacao.unlock(caminho, execucao);
  this.aplicacao.purge(caminho, execucao);
  this.aplicacao.propfind(caminho, execucao); */

  iniciar() {
    this.aplicacao.listen(this.porta, () => {
      console.log(`Aplicação iniciada na porta ${this.porta}`);
    });
  }
}
