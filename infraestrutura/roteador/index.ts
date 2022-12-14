import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import passport from 'passport';

import { VariavelInterface } from '@designliquido/delegua/fontes/interfaces';

export class Roteador {
    aplicacao: express.Express;
    porta: number;

    private morgan = false;
    private helmet = false;
    private expressJson = false;
    private cookieParser = false;

    private cors = false;
    private passport = false;

    constructor() {
        this.aplicacao = express();
        this.porta = Number(process.env.PORTA) || Number(process.env.PORT) || 3000;
    }

    configuraArquivosEstaticos(diretorio: string = 'publico'): void {
        this.aplicacao.use(express.static(diretorio));
    }

    ativarMiddleware(nomePropriedade: string, informacoesVariavel: VariavelInterface) {
        switch (nomePropriedade) {
            case 'cors':
                this.ativarDesativarCors(informacoesVariavel.valor);
                break;
            case 'cookieParser':
                this.ativarDesativarCookieParser(informacoesVariavel.valor);
                break;
            case 'json':
                this.ativarDesativarExpressJson(informacoesVariavel.valor);
                break;
            case 'passport':
                this.ativarDesativarPassport(informacoesVariavel.valor);
                break;
            case 'morgan':
                this.ativarDesativarMorgan(informacoesVariavel.valor);
                break;
            case 'helmet':
                this.ativarDesativarHelmet(informacoesVariavel.valor);
                break;
            case 'diretorioEstatico':
                this.configuraArquivosEstaticos(informacoesVariavel.valor);
                break;
            default:
                console.log(`Método ${nomePropriedade} não reconhecido.`);
                break;
        }
    }

    iniciarMiddlewares() {
        if (this.morgan) {
            this.aplicacao.use(morgan('dev'));
        }

        if (this.helmet) {
            this.aplicacao.use(helmet());
        }

        if (this.expressJson) {
            this.aplicacao.use(express.json());
        }

        if (this.cookieParser) {
            this.aplicacao.use(cookieParser());
        }

        if (this.cors) {
            this.aplicacao.use(cors());
        }

        if (this.passport) {
            this.aplicacao.use(passport.initialize());
        }
    }

    ativarDesativarCors(valor: boolean): void {
        this.cors = valor;
    }

    ativarDesativarPassport(valor: boolean): void {
        this.passport = valor;
    }

    ativarDesativarCookieParser(valor: boolean): void {
        this.cookieParser = valor;
    }

    ativarDesativarExpressJson(valor: boolean): void {
        this.expressJson = valor;
    }

    ativarDesativarHelmet(valor: boolean): void {
        this.helmet = valor;
    }

    ativarDesativarMorgan(valor: boolean): void {
        this.morgan = valor;
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
