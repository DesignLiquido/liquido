import { Comentario } from '@designliquido/delegua/declaracoes';

import { CentroConfiguracoes } from '../../fontes/infraestrutura/centro-configuracoes';
import { ConfiguracaoAplicacao } from '../../fontes/infraestrutura/centro-configuracoes/configuracao-aplicacao';
import { ConfiguracaoAutenticacao } from '../../fontes/infraestrutura/centro-configuracoes/configuracao-autenticacao';
import { ConfiguracaoDados } from '../../fontes/infraestrutura/centro-configuracoes/configuracao-dados';
import { ConfiguracaoEstilos } from '../../fontes/infraestrutura/centro-configuracoes/configuracao-estilos';
import { ConfiguracaoLicenca } from '../../fontes/infraestrutura/centro-configuracoes/configuracao-licenca';
import { ConfiguracaoLincones } from '../../fontes/infraestrutura/centro-configuracoes/configuracao-lincones';
import { ConfiguracaoLiquido } from '../../fontes/infraestrutura/centro-configuracoes/configuracao-liquido';
import { ConfiguracaoRoteador } from '../../fontes/infraestrutura/centro-configuracoes/configuracao-roteador';
import { ErroConfiguracao } from '../../fontes/infraestrutura/centro-configuracoes/erro-configuracao';

describe('Testes das classes de configuração', () => {
    describe('ErroConfiguracao', () => {
        it('deve ser uma instância de Error', () => {
            const erro = new ErroConfiguracao('mensagem de erro');
            expect(erro).toBeInstanceOf(Error);
            expect(erro).toBeInstanceOf(ErroConfiguracao);
        });

        it('deve ter a mensagem correta', () => {
            const erro = new ErroConfiguracao('mensagem de erro');
            expect(erro.message).toBe('mensagem de erro');
        });
    });

    describe('ConfiguracaoLicenca', () => {
        it('deve criar uma instância com valores padrão', () => {
            const config = new ConfiguracaoLicenca();
            expect(config.nome).toBeUndefined();
            expect(config.url).toBeUndefined();
        });

        it('deve criar uma instância com valores iniciais', () => {
            const config = new ConfiguracaoLicenca({ nome: 'MIT', url: 'https://opensource.org/licenses/MIT' });
            expect(config.nome).toBe('MIT');
            expect(config.url).toBe('https://opensource.org/licenses/MIT');
        });

        it('deve configurar nomeLicenca quando nome estiver definido', () => {
            const config = new ConfiguracaoLicenca({ nome: 'MIT' });
            const autoDocumentador = { nomeAplicacao: '', versao: '', descricao: '', nomeLicenca: '', urlLicensa: '', documentar: jest.fn() };
            config.configurar({ autoDocumentador });
            expect(autoDocumentador.nomeLicenca).toBe('MIT');
        });

        it('deve configurar urlLicensa quando url estiver definida', () => {
            const config = new ConfiguracaoLicenca({ url: 'https://opensource.org/licenses/MIT' });
            const autoDocumentador = { nomeAplicacao: '', versao: '', descricao: '', nomeLicenca: '', urlLicensa: '', documentar: jest.fn() };
            config.configurar({ autoDocumentador });
            expect(autoDocumentador.urlLicensa).toBe('https://opensource.org/licenses/MIT');
        });

        it('não deve configurar nomeLicenca ou urlLicensa quando não definidos', () => {
            const config = new ConfiguracaoLicenca();
            const autoDocumentador = { nomeAplicacao: '', versao: '', descricao: '', nomeLicenca: 'existente', urlLicensa: 'existente', documentar: jest.fn() };
            config.configurar({ autoDocumentador });
            expect(autoDocumentador.nomeLicenca).toBe('existente');
            expect(autoDocumentador.urlLicensa).toBe('existente');
        });
    });

    describe('ConfiguracaoLincones', () => {
        it('deve criar uma instância com valores padrão', () => {
            const config = new ConfiguracaoLincones();
            expect(config.tecnologia).toBeUndefined();
            expect(config.caminho).toBeUndefined();
        });

        it('deve criar uma instância com valores iniciais', () => {
            const config = new ConfiguracaoLincones({ tecnologia: 'sqlite', caminho: './banco.db' });
            expect(config.tecnologia).toBe('sqlite');
            expect(config.caminho).toBe('./banco.db');
        });

        it('deve chamar provedorLincones.configurar com tecnologia e caminho', () => {
            const config = new ConfiguracaoLincones({ tecnologia: 'sqlite', caminho: './banco.db' });
            const provedorLincones = { configurar: jest.fn(), configurado: false, resolver: jest.fn() };
            config.configurar({ provedorLincones });
            expect(provedorLincones.configurar).toHaveBeenCalledWith('tecnologia', 'sqlite');
            expect(provedorLincones.configurar).toHaveBeenCalledWith('caminho', './banco.db');
        });
    });

    describe('ConfiguracaoDados', () => {
        it('deve criar uma instância com lincones inicializado', () => {
            const config = new ConfiguracaoDados();
            expect(config.lincones).toBeInstanceOf(ConfiguracaoLincones);
        });

        it('deve ter motor como "lincones" por padrão', () => {
            const config = new ConfiguracaoDados();
            expect(config.motor).toBe('lincones');
        });

        it('deve aceitar motor "delegua-entidades" via definirValor', () => {
            const config = new ConfiguracaoDados();
            config.definirValor(config, ['dados', 'motor'], 'delegua-entidades');
            expect(config.motor).toBe('delegua-entidades');
        });

        it('deve ter autoInicializar como false por padrão via lincones', () => {
            const config = new ConfiguracaoLincones();
            expect(config.autoInicializar).toBe(false);
        });

        it('deve aceitar autoInicializar verdadeiro via definirValor em lincones', () => {
            const config = new ConfiguracaoLincones();
            config.definirValor(config, ['lincones', 'autoInicializar'], true);
            expect(config.autoInicializar).toBe(true);
        });

        it('deve ter arquivoInicializacao com valor padrão "inicializacao.lincones" via lincones', () => {
            const config = new ConfiguracaoLincones();
            expect(config.arquivoInicializacao).toBe('inicializacao.lincones');
        });

        it('deve aceitar arquivoInicializacao personalizado via definirValor em lincones', () => {
            const config = new ConfiguracaoLincones();
            config.definirValor(config, ['lincones', 'arquivoInicializacao'], 'banco-inicial.lincones');
            expect(config.arquivoInicializacao).toBe('banco-inicial.lincones');
        });

        it('deve delegar configurar para lincones', () => {
            const config = new ConfiguracaoDados();
            const provedorLincones = { configurar: jest.fn(), configurado: false, resolver: jest.fn() };
            config.configurar({ provedorLincones });
            expect(provedorLincones.configurar).toHaveBeenCalled();
        });
    });

    describe('ConfiguracaoAplicacao', () => {
        it('deve criar uma instância com licenca inicializada', () => {
            const config = new ConfiguracaoAplicacao();
            expect(config.licenca).toBeInstanceOf(ConfiguracaoLicenca);
        });

        it('deve configurar o autoDocumentador e delegar para licenca', () => {
            const config = new ConfiguracaoAplicacao();
            config.nome = 'MeuApp';
            config.versao = '1.0.0';
            config.descricao = 'Descrição do app';
            const autoDocumentador = { nomeAplicacao: '', versao: '', descricao: '', nomeLicenca: '', urlLicensa: '', documentar: jest.fn() };
            config.configurar({ autoDocumentador });
            expect(autoDocumentador.nomeAplicacao).toBe('MeuApp');
            expect(autoDocumentador.versao).toBe('1.0.0');
            expect(autoDocumentador.descricao).toBe('Descrição do app');
        });
    });

    describe('ConfiguracaoRoteador', () => {
        it('deve criar uma instância com valores padrão', () => {
            const config = new ConfiguracaoRoteador();
            expect(config.diretorioEstatico).toBe('publico');
            expect(config.cors).toBe(false);
            expect(config.bodyParser).toBe(true);
            expect(config.morgan).toBe(false);
            expect(config.cookieParser).toBe(true);
            expect(config.passport).toBe(false);
            expect(config.json).toBe(true);
            expect(config.helmet).toBe(true);
        });

        it('deve criar uma instância com valores iniciais', () => {
            const config = new ConfiguracaoRoteador({ cors: true, morgan: true, passport: true });
            expect(config.cors).toBe(true);
            expect(config.morgan).toBe(true);
            expect(config.passport).toBe(true);
        });

        it('deve configurar o roteador chamando todos os métodos', () => {
            const config = new ConfiguracaoRoteador();
            const roteador = {
                ativarDesativarBodyParser: jest.fn(),
                ativarDesativarCors: jest.fn(),
                configurarOrigensCors: jest.fn(),
                ativarDesativarCookieParser: jest.fn(),
                ativarDesativarExpressJson: jest.fn(),
                ativarDesativarHelmet: jest.fn(),
                ativarDesativarMorgan: jest.fn(),
                ativarDesativarPassport: jest.fn(),
                configurarArquivosEstaticos: jest.fn()
            };
            config.configurar({ roteador });
            expect(roteador.ativarDesativarBodyParser).toHaveBeenCalledWith(true);
            expect(roteador.ativarDesativarCors).toHaveBeenCalledWith(false);
            expect(roteador.configurarOrigensCors).toHaveBeenCalledWith('*');
            expect(roteador.ativarDesativarCookieParser).toHaveBeenCalledWith(true);
            expect(roteador.ativarDesativarExpressJson).toHaveBeenCalledWith(true);
            expect(roteador.ativarDesativarHelmet).toHaveBeenCalledWith(true);
            expect(roteador.ativarDesativarMorgan).toHaveBeenCalledWith(false);
            expect(roteador.ativarDesativarPassport).toHaveBeenCalledWith(false);
            // configurarArquivosEstaticos agora é chamado em liquido.ts com caminho absoluto
            expect(roteador.configurarArquivosEstaticos).not.toHaveBeenCalled();
        });

        it('não deve chamar configurarArquivosEstaticos quando diretorioEstatico for vazio', () => {
            const config = new ConfiguracaoRoteador({ diretorioEstatico: '' });
            const roteador = {
                ativarDesativarBodyParser: jest.fn(),
                ativarDesativarCors: jest.fn(),
                configurarOrigensCors: jest.fn(),
                ativarDesativarCookieParser: jest.fn(),
                ativarDesativarExpressJson: jest.fn(),
                ativarDesativarHelmet: jest.fn(),
                ativarDesativarMorgan: jest.fn(),
                ativarDesativarPassport: jest.fn(),
                configurarArquivosEstaticos: jest.fn()
            };
            config.configurar({ roteador });
            expect(roteador.configurarArquivosEstaticos).not.toHaveBeenCalled();
        });
    });

    describe('ConfiguracaoEstilos', () => {
        it('deve criar uma instância com valor padrão "publico/css"', () => {
            const config = new ConfiguracaoEstilos();
            expect(config.diretorioBase).toBe('publico/css');
        });

        it('deve criar uma instância com valores iniciais', () => {
            const config = new ConfiguracaoEstilos({ diretorioBase: 'assets/estilos' });
            expect(config.diretorioBase).toBe('assets/estilos');
        });

        it('deve aceitar diretorioBase personalizado via definirValor', () => {
            const config = new ConfiguracaoEstilos();
            config.definirValor(config, ['estilos', 'diretorioBase'], 'assets/css');
            expect(config.diretorioBase).toBe('assets/css');
        });
    });

    describe('ConfiguracaoAutenticacao', () => {
        it('deve criar uma instância com tecnologia indefinida', () => {
            const config = new ConfiguracaoAutenticacao();
            expect(config.tecnologia).toBeUndefined();
        });

        it('não deve chamar ativarDesativarPassport quando tecnologia não estiver definida', () => {
            const config = new ConfiguracaoAutenticacao();
            const roteador = { ativarDesativarPassport: jest.fn() };
            config.configurar({ roteador });
            expect(roteador.ativarDesativarPassport).not.toHaveBeenCalled();
        });

        it('deve ativar passport quando tecnologia for jwt', () => {
            const config = new ConfiguracaoAutenticacao();
            config.tecnologia = 'jwt';
            const roteador = { ativarDesativarPassport: jest.fn() };
            config.configurar({ roteador });
            expect(roteador.ativarDesativarPassport).toHaveBeenCalledWith(true);
        });

        it('deve chamar console.error para tecnologia não suportada', () => {
            const config = new ConfiguracaoAutenticacao();
            config.tecnologia = 'oauth';
            const roteador = { ativarDesativarPassport: jest.fn() };
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            config.configurar({ roteador });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('ConfiguracaoLiquido', () => {
        it('deve ler e definir a linguagem via getter e setter', () => {
            const config = new ConfiguracaoLiquido();
            expect(config.linguagem).toBe('delegua');
            config.linguagem = 'pitugues';
            expect(config.linguagem).toBe('pitugues');
        });

        it('deve criar uma instância com as configurações aninhadas', () => {
            const config = new ConfiguracaoLiquido();
            expect(config.aplicacao).toBeInstanceOf(ConfiguracaoAplicacao);
            expect(config.dados).toBeInstanceOf(ConfiguracaoDados);
            expect(config.roteador).toBeInstanceOf(ConfiguracaoRoteador);
            expect(config.estilos).toBeInstanceOf(ConfiguracaoEstilos);
        });

        it('deve delegar configurar para as três configurações aninhadas', () => {
            const config = new ConfiguracaoLiquido();
            const autoDocumentador = { nomeAplicacao: '', versao: '', descricao: '', nomeLicenca: '', urlLicensa: '', documentar: jest.fn() };
            const roteador = {
                ativarDesativarBodyParser: jest.fn(),
                ativarDesativarCors: jest.fn(),
                configurarOrigensCors: jest.fn(),
                ativarDesativarCookieParser: jest.fn(),
                ativarDesativarExpressJson: jest.fn(),
                ativarDesativarHelmet: jest.fn(),
                ativarDesativarMorgan: jest.fn(),
                ativarDesativarPassport: jest.fn(),
                configurarArquivosEstaticos: jest.fn()
            };
            const provedorLincones = { configurar: jest.fn(), configurado: false, resolver: jest.fn() };
            config.configurar({ autoDocumentador, roteador, provedorLincones });
            expect(roteador.ativarDesativarBodyParser).toHaveBeenCalled();
            expect(provedorLincones.configurar).toHaveBeenCalled();
        });
    });

    describe('ConfiguracaoComum.definirValor', () => {
        it('deve definir valor em propriedade de primeiro nível', () => {
            const config = new ConfiguracaoRoteador();
            config.definirValor(config, ['roteador', 'cors'], true);
            expect(config.cors).toBe(true);
        });

        it('deve lançar ErroConfiguracao para propriedade inexistente em primeiro nível', () => {
            const config = new ConfiguracaoRoteador();
            expect(() => config.definirValor(config, ['roteador', 'propriedadeInexistente'], true)).toThrow(ErroConfiguracao);
        });

        it('deve definir valor em propriedade aninhada', () => {
            const config = new ConfiguracaoLiquido();
            config.definirValor(config, ['liquido', 'roteador', 'cors'], true);
            expect(config.roteador.cors).toBe(true);
        });

        it('deve lançar ErroConfiguracao para propriedade aninhada inexistente', () => {
            const config = new ConfiguracaoLiquido();
            expect(() => config.definirValor(config, ['liquido', 'propriedadeInexistente', 'cors'], true)).toThrow(ErroConfiguracao);
        });
    });

    describe('CentroConfiguracoes', () => {
        it('deve criar uma instância com lista vazia de declarações', () => {
            const centro = new CentroConfiguracoes([]);
            expect(centro.liquido).toBeTruthy();
        });

        it('deve ignorar declarações do tipo Comentario', () => {
            const comentario = new Comentario(0, 1, '// comentário', false);
            const centro = new CentroConfiguracoes([comentario as any]);
            expect(centro.liquido).toBeTruthy();
        });

        it('deve processar declaração simples sem objeto aninhado', () => {
            const novoRoteador = new ConfiguracaoRoteador({ cors: true });
            const declaracao = {
                expressao: {
                    objeto: { simbolo: { lexema: 'liquido' }, objeto: null },
                    nome: { lexema: 'roteador' },
                    valor: { valor: novoRoteador }
                }
            };
            const centro = new CentroConfiguracoes([declaracao as any]);
            expect(centro.liquido.roteador.cors).toBe(true);
        });

        it('deve processar declaração com objeto aninhado em dois níveis', () => {
            const declaracao = {
                expressao: {
                    objeto: {
                        simbolo: { lexema: 'roteador' },
                        objeto: { simbolo: { lexema: 'liquido' }, objeto: null }
                    },
                    nome: { lexema: 'cors' },
                    valor: { valor: true }
                }
            };
            const centro = new CentroConfiguracoes([declaracao as any]);
            expect(centro.liquido.roteador.cors).toBe(true);
        });

        it('deve processar declaração com objeto aninhado em três níveis', () => {
            const declaracao = {
                expressao: {
                    objeto: {
                        simbolo: { lexema: 'lincones' },
                        objeto: {
                            simbolo: { lexema: 'dados' },
                            objeto: { simbolo: { lexema: 'liquido' }, objeto: null }
                        }
                    },
                    nome: { lexema: 'tecnologia' },
                    valor: { valor: 'sqlite' }
                }
            };
            const centro = new CentroConfiguracoes([declaracao as any]);
            expect(centro.liquido.dados.lincones.tecnologia).toBe('sqlite');
        });
    });
});
