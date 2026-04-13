import * as caminho from 'path';
import { FuncaoConstruto } from '@designliquido/delegua/construtos';
import { Liquido } from '../fontes/liquido';

/**
 * Cria um FuncaoConstruto mínimo para usar como placeholder em testes.
 * O corpo vazio é suficiente porque executarFuncaoRota é espionado.
 */
function criarFuncaoFake(): FuncaoConstruto {
    return new FuncaoConstruto(-1, 1, [], [], 'qualquer', false);
}

describe('Cadeia de middlewares — adicionarRota', () => {
    let liquido: Liquido;
    let callbackCapturado: ((req: any, res: any) => Promise<void>) | null;
    let executarFuncaoRotaSpy: jest.SpyInstance;
    let mockReq: any;
    let mockRes: any;

    beforeEach(() => {
        liquido = new Liquido(caminho.join(__dirname, 'exemplos'));

        (liquido as any).centroConfiguracoes = {
            liquido: { linguagem: 'delegua', arquetipo: 'rest' }
        };

        callbackCapturado = null;

        // adicionarRota usa mapaRotas['Get'] (cópia encapsulada no construtor),
        // não rotaGet diretamente — precisa sobrescrever a entrada do mapa.
        liquido.roteador.mapaRotas['Get'] = jest.fn(
            (_caminho: string, callback: any) => {
                callbackCapturado = callback;
            }
        );

        executarFuncaoRotaSpy = jest
            .spyOn(liquido as any, 'executarFuncaoRota')
            .mockResolvedValue({});

        mockReq = { body: {}, params: {}, query: {}, path: '/teste' };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            redirect: jest.fn(),
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('Deve registrar a rota no roteador', async () => {
        const handler = criarFuncaoFake();

        await (liquido as any).adicionarRota('rotaGet', '/teste', [handler]);

        expect(liquido.roteador.mapaRotas['Get']).toHaveBeenCalledWith('/teste', expect.any(Function));
    });

    it('Deve logar erro e não registrar quando não há funções', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await (liquido as any).adicionarRota('rotaGet', '/teste', []);

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('/teste'));
        expect(liquido.roteador.mapaRotas['Get']).not.toHaveBeenCalled();

        consoleSpy.mockRestore();
    });

    it('Handler único: executarFuncaoRota chamado uma vez com a função correta', async () => {
        const handler = criarFuncaoFake();
        executarFuncaoRotaSpy.mockResolvedValue({ corpoRetorno: 'OK', statusHttp: 200 });

        await (liquido as any).adicionarRota('rotaGet', '/teste', [handler]);
        await callbackCapturado!(mockReq, mockRes);

        expect(executarFuncaoRotaSpy).toHaveBeenCalledTimes(1);
        expect(executarFuncaoRotaSpy).toHaveBeenCalledWith(
            mockReq, '/teste', handler, 'handler_rotaGet'
        );
    });

    it('Handler único: status e corpo da resposta são enviados ao cliente', async () => {
        const handler = criarFuncaoFake();
        executarFuncaoRotaSpy.mockResolvedValue({ corpoRetorno: 'Olá mundo', statusHttp: 200 });

        await (liquido as any).adicionarRota('rotaGet', '/teste', [handler]);
        await callbackCapturado!(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.send).toHaveBeenCalledWith('Olá mundo');
    });

    it('Middleware que não para a cadeia: handler é executado após o middleware', async () => {
        const middleware = criarFuncaoFake();
        const handler = criarFuncaoFake();

        // Middleware não define resposta, handler define
        executarFuncaoRotaSpy
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({ corpoRetorno: 'Resultado', statusHttp: 200 });

        await (liquido as any).adicionarRota('rotaGet', '/teste', [middleware, handler]);
        await callbackCapturado!(mockReq, mockRes);

        expect(executarFuncaoRotaSpy).toHaveBeenCalledTimes(2);
        const [chamadaMiddleware, chamadaHandler] = executarFuncaoRotaSpy.mock.calls;
        expect(chamadaMiddleware[2]).toBe(middleware);
        expect(chamadaHandler[2]).toBe(handler);
    });

    it('Middleware que para a cadeia: handler não é executado', async () => {
        const middleware = criarFuncaoFake();
        const handler = criarFuncaoFake();

        // Middleware envia resposta — cadeia deve parar
        executarFuncaoRotaSpy.mockResolvedValueOnce({
            corpoRetorno: 'Não autorizado',
            statusHttp: 401,
        });

        await (liquido as any).adicionarRota('rotaGet', '/teste', [middleware, handler]);
        await callbackCapturado!(mockReq, mockRes);

        expect(executarFuncaoRotaSpy).toHaveBeenCalledTimes(1);
        expect(executarFuncaoRotaSpy.mock.calls[0][2]).toBe(middleware);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.send).toHaveBeenCalledWith('Não autorizado');
    });

    it('Múltiplos middlewares: primeiro para a cadeia, segundo e handler não executam', async () => {
        const mw1 = criarFuncaoFake();
        const mw2 = criarFuncaoFake();
        const handler = criarFuncaoFake();

        executarFuncaoRotaSpy.mockResolvedValueOnce({ statusHttp: 403 });

        await (liquido as any).adicionarRota('rotaGet', '/teste', [mw1, mw2, handler]);
        await callbackCapturado!(mockReq, mockRes);

        expect(executarFuncaoRotaSpy).toHaveBeenCalledTimes(1);
        expect(executarFuncaoRotaSpy.mock.calls[0][2]).toBe(mw1);
    });

    it('Múltiplos middlewares: todos passam, handler executa por último', async () => {
        const mw1 = criarFuncaoFake();
        const mw2 = criarFuncaoFake();
        const handler = criarFuncaoFake();

        executarFuncaoRotaSpy
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({ corpoRetorno: 'OK', statusHttp: 200 });

        await (liquido as any).adicionarRota('rotaGet', '/teste', [mw1, mw2, handler]);
        await callbackCapturado!(mockReq, mockRes);

        expect(executarFuncaoRotaSpy).toHaveBeenCalledTimes(3);
        expect(executarFuncaoRotaSpy.mock.calls[0][2]).toBe(mw1);
        expect(executarFuncaoRotaSpy.mock.calls[1][2]).toBe(mw2);
        expect(executarFuncaoRotaSpy.mock.calls[2][2]).toBe(handler);
    });

    it('Redirecionamento: res.redirect é chamado em vez de status+send', async () => {
        const handler = criarFuncaoFake();
        executarFuncaoRotaSpy.mockResolvedValue({ redirecionamento: '/nova-rota' });

        await (liquido as any).adicionarRota('rotaGet', '/teste', [handler]);
        await callbackCapturado!(mockReq, mockRes);

        expect(mockRes.redirect).toHaveBeenCalledWith('/nova-rota');
        expect(mockRes.send).not.toHaveBeenCalled();
    });
});
