import express, { Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import cors from 'cors';

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
        this.porta = 3000;
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

    getCors(): boolean {
        return this.cors;
    }

    setCors(valor: boolean): void {
        console.log('Definindo intermediario CORS como: ', valor);
        this.cors = valor;
    }

    getPassport(): boolean {
        return this.passport;
    }

    setPassport(valor: boolean): void {
        this.passport = valor;
    }

    getCookieParser(): boolean {
        return this.cookieParser;
    }

    setCookieParser(valor: boolean): void {
        this.cookieParser = valor;
    }

    getExpressJson(): boolean {
        return this.expressJson;
    }

    setExpressJson(valor: boolean): void {
        this.expressJson = valor;
    }

    getHelmet(): boolean {
        return this.helmet;
    }

    setHelmet(valor: boolean): void {
        this.helmet = valor;
    }

    getMorgan(): boolean {
        return this.morgan;
    }

    setMorgan(valor: boolean): void {
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
