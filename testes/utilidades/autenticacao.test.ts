import Autenticacao from '../../infraestrutura/utilidades/autenticacao';

describe('Autenticação', () => {
    const ANTIGO_AMBIENTE = process.env;

    beforeAll(() => {
        jest.resetModules();
        process.env = { ...ANTIGO_AMBIENTE };
    });

    afterAll(() => {
        process.env = ANTIGO_AMBIENTE;
    });

    it('deve retornar um objeto com as funções initialize e authenticate', async () => {
        process.env.chaveSecreta = '123';
        const autenticacao = Autenticacao();
        expect(autenticacao).toHaveProperty('initialize');
        expect(autenticacao).toHaveProperty('authenticate');
    })

    it('deve retornar um objeto com a função initialize que retorna uma função', async () => {
        process.env.chaveSecreta = '123';
        const autenticacao = Autenticacao();
        const initialize = autenticacao.initialize();
        expect(typeof initialize).toBe('function');
    })

    it('deve retornar um objeto com a função authenticate que retorna uma função', async () => {
        process.env.chaveSecreta = '123';
        process.env.sessao = 'false';
        const autenticacao = Autenticacao();
        const authenticate = autenticacao.authenticate();
        expect(typeof authenticate).toBe('function');
    })

});
