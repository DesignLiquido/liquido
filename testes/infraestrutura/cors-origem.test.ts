import { Roteador } from '../../fontes/infraestrutura/roteador/roteador';
import { ConfiguracaoRoteador } from '../../fontes/infraestrutura/centro-configuracoes/configuracao-roteador';
import { AutoDocumentador } from '../../fontes/infraestrutura/auto-documentacao/auto-documentador';

/**
 * Testes de regressão para o achado B4 (issue #119):
 * a origem do CORS deve ser explícita e configurável por
 * `liquido.roteador.corsOrigem`, com aviso quando liberada para
 * qualquer origem ('*').
 */
describe('CORS com origem configurável', () => {
    const criarRoteador = (): Roteador => new Roteador(new AutoDocumentador());

    describe('Roteador.resolverOpcoesCors', () => {
        it("padrão '*' resolve para undefined (comportamento liberado do middleware)", () => {
            const roteador = criarRoteador();
            expect(roteador.resolverOpcoesCors()).toBeUndefined();
        });

        it('uma origem única resolve para lista com um item', () => {
            const roteador = criarRoteador();
            roteador.configurarOrigemCors('https://meusite.com.br');
            expect(roteador.resolverOpcoesCors()).toEqual({
                origin: ['https://meusite.com.br']
            });
        });

        it('múltiplas origens separadas por vírgula resolvem para lista, ignorando espaços', () => {
            const roteador = criarRoteador();
            roteador.configurarOrigemCors('https://a.com.br, https://b.com.br ,https://c.com.br');
            expect(roteador.resolverOpcoesCors()).toEqual({
                origin: ['https://a.com.br', 'https://b.com.br', 'https://c.com.br']
            });
        });

        it('valor vazio ou apenas vírgulas volta ao comportamento padrão', () => {
            const roteador = criarRoteador();
            roteador.configurarOrigemCors('');
            expect(roteador.resolverOpcoesCors()).toBeUndefined();

            roteador.configurarOrigemCors(' , ,');
            expect(roteador.resolverOpcoesCors()).toBeUndefined();
        });
    });

    describe('Aviso de desenvolvimento na inicialização', () => {
        let espiaoConsole: jest.SpyInstance;

        beforeEach(() => {
            espiaoConsole = jest.spyOn(console, 'log').mockImplementation(() => {});
        });

        afterEach(() => {
            espiaoConsole.mockRestore();
        });

        const saidaConsole = (): string =>
            espiaoConsole.mock.calls.map((chamada) => String(chamada[0])).join('\n');

        it("deve avisar quando CORS está habilitado com origem '*'", () => {
            const roteador = criarRoteador();
            roteador.ativarDesativarCors(true);
            roteador.iniciarMiddlewares();

            expect(saidaConsole()).toContain("CORS habilitado para qualquer origem ('*')");
            expect(saidaConsole()).toContain('apenas para desenvolvimento');
        });

        it('não deve avisar quando a origem está restringida', () => {
            const roteador = criarRoteador();
            roteador.ativarDesativarCors(true);
            roteador.configurarOrigemCors('https://meusite.com.br');
            roteador.iniciarMiddlewares();

            expect(saidaConsole()).not.toContain('CORS habilitado para qualquer origem');
        });

        it('não deve avisar quando CORS está desabilitado', () => {
            const roteador = criarRoteador();
            roteador.iniciarMiddlewares();

            expect(saidaConsole()).not.toContain('CORS habilitado para qualquer origem');
        });
    });

    describe('ConfiguracaoRoteador', () => {
        it("deve ter '*' como padrão de corsOrigem", () => {
            const configuracao = new ConfiguracaoRoteador();
            expect(configuracao.corsOrigem).toBe('*');
        });

        it('deve repassar corsOrigem ao roteador em configurar()', () => {
            const configuracao = new ConfiguracaoRoteador({
                cors: true,
                corsOrigem: 'https://meusite.com.br'
            });

            const roteadorSimulado = {
                ativarDesativarBodyParser: jest.fn(),
                ativarDesativarCors: jest.fn(),
                configurarOrigemCors: jest.fn(),
                ativarDesativarCookieParser: jest.fn(),
                ativarDesativarExpressJson: jest.fn(),
                ativarDesativarHelmet: jest.fn(),
                ativarDesativarMorgan: jest.fn(),
                ativarDesativarPassport: jest.fn()
            };

            configuracao.configurar({ roteador: roteadorSimulado });

            expect(roteadorSimulado.ativarDesativarCors).toHaveBeenCalledWith(true);
            expect(roteadorSimulado.configurarOrigemCors).toHaveBeenCalledWith('https://meusite.com.br');
        });
    });

    describe('Templates do scaffold', () => {
        it.each([
            ['delegua/api-rest'],
            ['delegua/mvc'],
            ['pitugues/api-rest'],
            ['pitugues/mvc']
        ])('template %s deve declarar corsOrigem explicitamente com aviso', (template: string) => {
            const sistemaArquivos = require('fs');
            const caminho = require('path');
            const conteudo = sistemaArquivos.readFileSync(
                caminho.join(
                    __dirname,
                    '../../fontes/interface-linha-comando/exemplos',
                    template,
                    'configuracao.delprops'
                ),
                'utf-8'
            );

            expect(conteudo).toContain("liquido.roteador.corsOrigem = '*'");
            expect(conteudo).toContain('apenas para desenvolvimento');
        });
    });
});
