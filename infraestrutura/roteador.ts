import { ConversorLmht } from '@designliquido/lmht-js';
import express, { Request, Response } from 'express';

export class Roteador {
	aplicacao: express.Express;
	porta: number;
	conversorLmht: ConversorLmht;

	constructor(conversorLmht: ConversorLmht) {
		this.aplicacao = express();
		this.porta = 3000;
		this.conversorLmht = conversorLmht;
	}

	middlewares() {
		this.aplicacao.use(express.json()); // iniciando middleware para o framework
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

	rotaOptions(caminho: string, execucao: (req: Request, res: Response) => void) {
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

	rotaPropfind(caminho: string, execucao: (req: Request, res: Response) => void) {
		this.aplicacao.propfind(caminho, execucao);
	}

	iniciar() {
		this.aplicacao.listen(this.porta, () => {
			console.log(`Aplicação iniciada na porta ${this.porta}`);
		});
	}
}
