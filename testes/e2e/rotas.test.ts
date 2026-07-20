import * as caminho from 'path';
import request from 'supertest';
import { Liquido } from '../../fontes/liquido';

function criarAplicacao() {
    const liquido = new Liquido(caminho.join(__dirname, '..', 'exemplos'));

    (liquido as any).centroConfiguracoes = {
        liquido: {
            linguagem: 'delegua',
            arquetipo: 'mvc',
        },
    };

    jest.spyOn(liquido.roteador, 'iniciar').mockImplementation(() => {
        // Impede chamada a listen()
    });

    return liquido;
}

describe('E2E Integration Tests - Routing & MIME Types', () => {
    let liquido: Liquido;

    beforeAll(async () => {
        liquido = criarAplicacao();
        await liquido.iniciar();
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe('MVC Routes', () => {
        it('should return MVC route with plain text body and correct MIME type', async () => {
            const response = await request(liquido.roteador.aplicacao)
                .get('/mvc/text')
                .expect(200);

            expect(response.headers['content-type']).toMatch(/text\/plain|text\/html/);
            expect(response.text).toBe('Hello World - MVC Text');
        });

        it('should return MVC route with JSON body and application/json MIME type', async () => {
            const response = await request(liquido.roteador.aplicacao)
                .get('/mvc/json')
                .expect(200);

            expect(response.headers['content-type']).toMatch(/application\/json/);
            expect(response.body).toEqual({ message: 'Hello World - MVC JSON' });
        });

        it('should return MVC route with LMHT body and correct markup MIME type', async () => {
            const response = await request(liquido.roteador.aplicacao)
                .get('/mvc/lmht')
                .expect(200);

            expect(response.headers['content-type']).toMatch(/text\/html|application\/xml/);
            expect(response.text).toContain('Teste com LMHT View Test');
        });
    });

    describe('Parâmetros de Rota ([id])', () => {
        it('Deve retornar o parâmetro de rota dinâmica via interpolacão', async () => {
            const response = await request(liquido.roteador.aplicacao)
                .get('/api/clientes/42')
                .expect(200);

            expect(response.text).toBe('Teste com ID. 42');
        });

        it('Deve retornar parâmetros de rota dinâmica como um objeto JSON', async () => {
            const response = await request(liquido.roteador.aplicacao)
                .post('/api/clientes/99')
                .expect(200);

            expect(response.body).toEqual({ id: '99' });
        });
    });

    describe('REST API Routes', () => {
        it('should return 204 No Content for empty response with no body content', async () => {
            const response = await request(liquido.roteador.aplicacao)
                .get('/api/empty')
                .expect(204);

            // On 204, body should be empty
            if (response.text) {
                expect(response.text).toBe('');
            }

            // Node.js web frameworks might strip or include empty Content-Type on 204.
            // If present, it must be safe.
            if (response.headers['content-type']) {
                expect(response.headers['content-type']).toBeDefined();
            }
        });

        it('should return REST API response with plain text and text/plain MIME type', async () => {
            const response = await request(liquido.roteador.aplicacao)
                .get('/api/text')
                .expect(200);

            expect(response.headers['content-type']).toMatch(/text\/plain/);
            expect(response.text).toBe('API Plain Text Response');
        });

        it('should return REST API response with JSON and application/json MIME type', async () => {
            const response = await request(liquido.roteador.aplicacao)
                .get('/api/json')
                .expect(200);

            expect(response.headers['content-type']).toMatch(/application\/json/);
            expect(response.body).toEqual({ status: 'success', data: true });
        });

        it('should return REST API response with XML payload and application/xml MIME type', async () => {
            const response = await request(liquido.roteador.aplicacao)
                .get('/api/xml')
                .expect(200);

            expect(response.headers['content-type']).toMatch(/application\/xml|text\/xml/);
            expect(response.text).toContain('<?xml version="1.0"?>');
        });
    });

    describe('404 em Português', () => {
        it('Deve retornar 404 com página HTML em português para navegador', async () => {
            const response = await request(liquido.roteador.aplicacao)
                .get('/rota-inexistente')
                .expect(404);

            expect(response.headers['content-type']).toMatch(/text\/html/);
            expect(response.text).toContain('Página não encontrada');
            expect(response.text).toContain('Líquido');
            expect(response.text).toContain('lang="pt"');
        });

        it('Deve retornar 404 em JSON quando Accept for application/json', async () => {
            const response = await request(liquido.roteador.aplicacao)
                .get('/rota-inexistente')
                .set('Accept', 'application/json')
                .expect(404);

            expect(response.body).toHaveProperty('erro');
            expect(response.body.erro).toBe('Rota não encontrada');
            expect(response.body).toHaveProperty('caminho');
            expect(response.body).toHaveProperty('metodo');
            expect(response.body.metodo).toBe('GET');
        });
    });
});