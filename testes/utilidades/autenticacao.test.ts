import Autenticacao from '../../infraestrutura/utilidades/autenticacao';

describe('Autenticacao', () => {
    it('deve retornar um objeto com as funções initialize e authenticate', async () => {
        const autenticacao = Autenticacao()
        expect(autenticacao).toHaveProperty('initialize')
        expect(autenticacao).toHaveProperty('authenticate')
    })

    it('deve retornar um objeto com a função initialize que retorna uma função', async () => {
        const autenticacao = Autenticacao()
        const initialize = autenticacao.initialize()
        expect(typeof initialize).toBe('function')
    })

    it('deve retornar um objeto com a função authenticate que retorna uma função', async () => {
        const autenticacao = Autenticacao()
        const authenticate = autenticacao.authenticate()
        expect(typeof authenticate).toBe('function')
    })

});
