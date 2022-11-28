import express, { Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import cors from 'cors';

export class Roteador {
    aplicacao: express.Express;
    porta: number;
    private DEFAULTS_MIDDLEWARES = true;

    constructor() {
        this.aplicacao = express();
        this.porta = 3000;
    }

    setDefaultMiddlewares(value: boolean) {
        this.DEFAULTS_MIDDLEWARES = value;
    }

    getDefaultMiddlewares() {
        return this.DEFAULTS_MIDDLEWARES;
    }

    defaultMiddlewares() {
        this.aplicacao.use(express.json());
        this.aplicacao.use(cors());
        this.aplicacao.use(helmet());
        this.aplicacao.use(morgan('combined'));
        this.aplicacao.use(cookieParser());
    }

    corsMiddleware() {
        this.aplicacao.use(cors());
    }

    cookieParserMiddleware() {
        this.aplicacao.use(cookieParser());
    }

    passportMiddleware() {
        this.aplicacao.use(passport.initialize());
        this.aplicacao.use(passport.session());
    }

    morganMiddleware() {
        this.aplicacao.use(morgan('combined'));
    }

    helmetMiddleware() {
        this.aplicacao.use(helmet());
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
