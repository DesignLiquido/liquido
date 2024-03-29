import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import jwt from 'jwt-simple';
import morgan from 'morgan';

import { VariavelInterface } from '@designliquido/delegua/fontes/interfaces';

import users from '../../usuarios';
import autenticacao from '../utilidades/autenticacao';

import { devolverVariavelAmbiente } from '../utilidades/variaveis-ambiente';
import { MetodoRoteador } from './metodo-roteador';

/**
 * O roteador é a classe que monta todas as rotas em que a aplicação irá trabalhar.
 * Instrumenta o Express para trabalhar interpretando Delégua.
 */
export class Roteador {
    aplicacao: express.Express;
    porta: number;
    mapaRotas: {[metodo: string]: (caminho: string, execucao: (req: Request, res: Response) => void) => void};

    morgan = false;
    helmet = false;
    expressJson = false;
    cookieParser = false;
    bodyParser = false;

    cors = false;
    passport = false;

    constructor() {
        this.aplicacao = express();
        this.porta = Number(process.env.PORTA) || Number(process.env.PORT) || 3000;
        
        this.mapaRotas = {};
        this.mapaRotas[MetodoRoteador.Get] = this.rotaGet.bind(this);
        this.mapaRotas[MetodoRoteador.Post] = this.rotaPost.bind(this);
        this.mapaRotas[MetodoRoteador.Put] = this.rotaPut.bind(this);
        this.mapaRotas[MetodoRoteador.Delete] = this.rotaDelete.bind(this);
        this.mapaRotas[MetodoRoteador.Patch] = this.rotaPatch.bind(this);
        this.mapaRotas[MetodoRoteador.Options] = this.rotaOptions.bind(this);
        this.mapaRotas[MetodoRoteador.Copy] = this.rotaCopy.bind(this);
        this.mapaRotas[MetodoRoteador.Head] = this.rotaHead.bind(this);
        this.mapaRotas[MetodoRoteador.Lock] = this.rotaLock.bind(this);
        this.mapaRotas[MetodoRoteador.Unlock] = this.rotaUnlock.bind(this);
        this.mapaRotas[MetodoRoteador.Purge] = this.rotaPurge.bind(this);
        this.mapaRotas[MetodoRoteador.Propfind] = this.rotaPropfind.bind(this);
    }

    configurarArquivosEstaticos(diretorio: string = 'publico'): void {
        this.aplicacao.use(express.static(diretorio, { redirect: true }));
    }

    ativarMiddleware(nomePropriedade: string, informacoesVariavel: VariavelInterface) {
        switch (nomePropriedade) {
            case 'cors':
                this.ativarDesativarCors(informacoesVariavel.valor);
                break;
            case 'cookieParser':
                this.ativarDesativarCookieParser(informacoesVariavel.valor);
                break;
            case 'bodyParser':
                this.ativarDesativarBodyParser(informacoesVariavel.valor);
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
                this.configurarArquivosEstaticos(informacoesVariavel.valor);
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

        if (this.bodyParser) {
            this.aplicacao.use(bodyParser.json());
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
            this.aplicacao.use(autenticacao().initialize());
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

    ativarDesativarBodyParser(valor: boolean): void {
        this.bodyParser = valor;
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

    adicionandoRotaToken() {
        this.aplicacao.post('/token', (req: Request, res: Response) => {
            if (req.body.email && req.body.senha) {
                const { email, senha } = req.body;
                const usuario = users.find((u) => {
                    return u.email === email && u.senha === senha;
                });
                if (usuario) {
                    const payload = {
                        id: usuario.id
                    };
                    const token = jwt.encode(payload, devolverVariavelAmbiente('chaveSecreta') as string);
                    users.find((u) => u.id === usuario.id).token = token;
                    return res.json({ token });
                } else {
                    res.sendStatus(401);
                }
            } else {
                res.sendStatus(401);
            }
        });
    }

    validarToken(req: Request, res: Response, next: NextFunction) {
        const token = req.headers['authorization'];
        if (token) {
            try {
                const decoded = jwt.decode(token, devolverVariavelAmbiente('chaveSecreta') as string);
                if (decoded) {
                    next();
                } else {
                    res.sendStatus(401);
                }
            } catch (error) {
                res.sendStatus(401);
            }
        } else {
            res.sendStatus(401);
        }
    }

    iniciar() {
        if (this.passport === true) {
            this.adicionandoRotaToken();
        }

        this.aplicacao.listen(this.porta, () => {
            console.log(`Aplicação iniciada na porta ${this.porta}`);
        });
    }
}
