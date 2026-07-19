import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import jwt from 'jwt-simple';
import { match } from 'path-to-regexp';
import morgan from 'morgan';
import redoc from 'redoc-express';

import users from '../../usuarios';
import autenticacao from '../utilidades/autenticacao';

import { devolverVariavelAmbiente } from '../utilidades/variaveis-ambiente';
import { MetodoRoteador } from './metodo-roteador';
import { AutoDocumentador } from '../auto-documentacao/auto-documentador';
import { RoteadorInterface } from '../../interfaces/roteador-interface';

/**
 * O roteador é a classe que monta todas as rotas em que a aplicação irá trabalhar.
 * Instrumenta o Express para trabalhar interpretando Delégua.
 */
export class Roteador implements RoteadorInterface {
    aplicacao: express.Express;
    autoDocumentador: AutoDocumentador;
    porta: number;
    mapaRotas: {[metodo: string]: (caminho: string, execucao: (req: Request, res: Response) => void) => void};
    private mapaCaminhosMetodos: Map<string, Set<string>>;

    morgan = false;
    helmet = false;
    expressJson = false;
    cookieParser = false;
    bodyParser = false;

    cors = false;
    origensCors: string[] = ['*'];
    passport = false;

    constructor(autoDocumentador: AutoDocumentador) {
        this.aplicacao = express();
        this.porta = 3000;

        this.autoDocumentador = autoDocumentador;
        
        this.mapaRotas = {};
        this.mapaCaminhosMetodos = new Map();
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

        // Rota reservada para servir o JSON de auto-documentação.
        this.aplicacao.get('/docs/openapi.json', async (req, res) => {
            const documentoOpenApi = await this.autoDocumentador.documentar();
            res.send(documentoOpenApi).status(200);
        });
  
        // Rota reservada para servir a documentação automática.
        this.aplicacao.get(
            '/docs',
            redoc({
                title: 'API Docs',
                specUrl: '/docs/openapi.json',
                redocOptions: {
                    theme: {
                        colors: {
                            primary: {
                            main: '#6EC5AB'
                            }
                        },
                        typography: {
                            fontFamily: `"museo-sans", 'Helvetica Neue', Helvetica, Arial, sans-serif`,
                            fontSize: '15px',
                            lineHeight: '1.5',
                            code: {
                            code: '#87E8C7',
                            backgroundColor: '#4D4D4E'
                            }
                        },
                        menu: {
                            backgroundColor: '#ffffff'
                        }
                    }
                }
            })
        );
    }
    configurarPorta(porta: number): void {
        this.porta = porta;

    }

    configurarArquivosEstaticos(diretorio: string = 'publico'): void {
        this.aplicacao.use(express.static(diretorio, { redirect: true }));
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
            // Formulários LMHT (`<formulário>`/`<campo>`) enviam POST como
            // `application/x-www-form-urlencoded` por padrão. Sem este middleware,
            // `requisicao.corpo` fica sempre vazio para esses envios.
            this.aplicacao.use(bodyParser.urlencoded({ extended: true }));
        }

        if (this.expressJson) {
            this.aplicacao.use(express.json());
            this.aplicacao.use(express.urlencoded({ extended: true }));
        }

        if (this.cookieParser) {
            this.aplicacao.use(cookieParser());
        }

        if (this.cors) {
            const opcoesCors = this.resolverOpcoesCors();
            if (opcoesCors === undefined) {
                console.log(
                    "[Liquido] CORS habilitado para qualquer origem ('*'). " +
                    "Adequado apenas para desenvolvimento; em produção, restrinja com " +
                    "liquido.roteador.origensCors = 'https://seudominio.com.br' em configuracao.delprops."
                );
                this.aplicacao.use(cors());
            } else {
                this.aplicacao.use(cors(opcoesCors));
            }
        }
        if (this.passport) {
            try {
                this.aplicacao.use(autenticacao().initialize());
            } catch (erro: any) {
                console.error('Erro ao inicializar o Passport:', erro.message, 'Autenticação não será ativada.');
            }
        }
    }

    ativarDesativarCors(valor: boolean): void {
        this.cors = valor;
    }

    /**
     * Define a(s) origem(ns) permitida(s) para CORS. Aceita uma única origem
     * ou várias separadas por vírgula. O valor '*' (padrão) libera qualquer
     * origem e deve ser usado apenas em desenvolvimento.
     */
    configurarOrigensCors(origem: string | string[]): void {
        if (Array.isArray(origem)) {
            this.origensCors = origem;
            return;
        }

        this.origensCors = origem.split(',').
        map(origem => origem.trim()).filter(origem => origem.length > 0);
    }

    /**
     * Traduz `origensCors` para as opções do middleware `cors`.
     * @returns `undefined` quando a origem é '*' (comportamento padrão do
     *          middleware, que libera qualquer origem), ou um objeto com a
     *          lista de origens permitidas.
     */
    resolverOpcoesCors(): { origin: string[] } | undefined {
        
        if (Array.isArray(this.origensCors)
            && this.origensCors.length === 1
            && this.origensCors[0] === '*') {
            return undefined;
        }
        if (this.origensCors.length === 0) {
            return undefined;
        }

        return { origin: this.origensCors };
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

    private registrarMetodoCaminho(caminho: string, metodo: string) {
        if (!this.mapaCaminhosMetodos.has(caminho)) {
            this.mapaCaminhosMetodos.set(caminho, new Set());
        }
        this.mapaCaminhosMetodos.get(caminho)!.add(metodo);
    }

    rotaGet(caminho: string, execucao: (req: Request, res: Response) => void) {
        this.aplicacao.get(caminho, execucao);
        this.registrarMetodoCaminho(caminho, 'GET');
    }

    rotaPost(caminho: string, execucao: (req: Request, res: Response) => void) {
        this.aplicacao.post(caminho, execucao);
        this.registrarMetodoCaminho(caminho, 'POST');
    }

    rotaPut(caminho: string, execucao: (req: Request, res: Response) => void) {
        this.aplicacao.put(caminho, execucao);
        this.registrarMetodoCaminho(caminho, 'PUT');
    }

    rotaPatch(caminho: string, execucao: (req: Request, res: Response) => void) {
        this.aplicacao.patch(caminho, execucao);
        this.registrarMetodoCaminho(caminho, 'PATCH');
    }

    rotaDelete(caminho: string, execucao: (req: Request, res: Response) => void) {
        this.aplicacao.delete(caminho, execucao);
        this.registrarMetodoCaminho(caminho, 'DELETE');
    }

    rotaOptions(caminho: string, execucao: (req: Request, res: Response) => void) {
        this.aplicacao.options(caminho, execucao);
        this.registrarMetodoCaminho(caminho, 'OPTIONS');
    }

    rotaCopy(caminho: string, execucao: (req: Request, res: Response) => void) {
        this.aplicacao.copy(caminho, execucao);
        this.registrarMetodoCaminho(caminho, 'COPY');
    }

    rotaHead(caminho: string, execucao: (req: Request, res: Response) => void) {
        this.aplicacao.head(caminho, execucao);
        this.registrarMetodoCaminho(caminho, 'HEAD');
    }

    rotaLock(caminho: string, execucao: (req: Request, res: Response) => void) {
        this.aplicacao.lock(caminho, execucao);
        this.registrarMetodoCaminho(caminho, 'LOCK');
    }

    rotaUnlock(caminho: string, execucao: (req: Request, res: Response) => void) {
        this.aplicacao.unlock(caminho, execucao);
        this.registrarMetodoCaminho(caminho, 'UNLOCK');
    }

    rotaPurge(caminho: string, execucao: (req: Request, res: Response) => void) {
        this.aplicacao.purge(caminho, execucao);
        this.registrarMetodoCaminho(caminho, 'PURGE');
    }

    rotaPropfind(caminho: string, execucao: (req: Request, res: Response) => void) {
        this.aplicacao.propfind(caminho, execucao);
        this.registrarMetodoCaminho(caminho, 'PROPFIND');
    }

    adicionarTratamentoMetodoNaoPermitido() {
        const metodosPorCaminho = this.mapaCaminhosMetodos;
        const matches = Array.from(metodosPorCaminho.entries()).map(([caminho, metodos]) => ({
            match: match(caminho, { decode: decodeURIComponent }),
            metodos
        }));

        this.aplicacao.use((req: Request, res: Response, next: NextFunction) => {
            for (const { match: matcher, metodos } of matches) {
                if (matcher(req.path)) {
                    if (!metodos.has(req.method)) {
                        const allow = Array.from(metodos).join(', ');
                        res.set('Allow', allow);
                        res.status(405).json({ erro: 'Método não permitido', metodosAceitos: allow });
                        return;
                    }
                    break;
                }
            }
            next();
        });
    }

    adicionarRotaToken() {
        this.aplicacao.post('/token', (req: Request, res: any) => {
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
                    const user = users.find((u) => u.id === usuario.id);
                    if (user) {
                        user.token = token;
                    }
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
            } catch (erro: any) {
                res.sendStatus(401);
            }
        } else {
            res.sendStatus(401);
        }
    }

    iniciar() {
        if (this.passport === true) {
            this.adicionarRotaToken();
        }

        this.aplicacao.listen(this.porta, () => {
            console.log(`Aplicação iniciada na porta ${this.porta}`);
        });
    }
}
