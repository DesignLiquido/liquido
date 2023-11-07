import { Roteador } from '../../infraestrutura/roteador';

jest.mock('express', () => {
    return () => ({
      use: jest.fn(),
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      options: jest.fn(),
      copy: jest.fn(),
      head: jest.fn(),
      lock: jest.fn(),
      unlock: jest.fn(),
      purge: jest.fn(),
      propfind: jest.fn(),
      listen: jest.fn(),
      static: jest.fn()
    });
  });

describe('Testes do roteador', () => {
    let roteador: Roteador;

    beforeEach(() => {
        roteador = new Roteador();
    });

    it('Deve criar um roteador', () => {
        expect(roteador).toBeTruthy();
    });

    it('deve chamar o método iniciar', () => {
        roteador.iniciar();
        expect(roteador.aplicacao.listen).toHaveBeenCalled();
    })

    it('deve chamar o método post para adicionandoRotaToken', () => {
        roteador.adicionandoRotaToken();
        expect(roteador.aplicacao.post).toHaveBeenCalled();
    })

    it('deve chamar o método ativarMiddleware cors', () => {
        roteador.ativarMiddleware('cors', {
            valor: true,
            tipo: 'lógico',
            imutavel: true
        });
        expect(roteador.cors).toBeTruthy()
    })

    it('deve chamar o método ativarMiddleware helmet', () => {
        roteador.ativarMiddleware('helmet', {
            valor: true,
            tipo: 'lógico',
            imutavel: true
        });
        expect(roteador.helmet).toBeTruthy()
    })

    it('deve chamar o método ativarMiddleware morgan', () => {
        roteador.ativarMiddleware('morgan', {
            valor: true,
            tipo: 'lógico',
            imutavel: true
        });
        expect(roteador.morgan).toBeTruthy()
    })

    it('deve chamar o método ativarMiddleware expressJson', () => {
        roteador.ativarMiddleware('json', {
            valor: true,
            tipo: 'lógico',
            imutavel: true
        });
        expect(roteador.expressJson).toBeTruthy()
    })

    it('deve chamar o método ativarMiddleware bodyParser', () => {
        roteador.ativarMiddleware('bodyParser', {
            valor: true,
            tipo: 'lógico',
            imutavel: true
        });
        expect(roteador.bodyParser).toBeTruthy()
    })

    it('deve chamar o método ativarMiddleware cookieParser', () => {
        roteador.ativarMiddleware('cookieParser', {
            valor: true,
            tipo: 'lógico',
            imutavel: true
        });
        expect(roteador.cookieParser).toBeTruthy()
    })

    it('deve chamar o método ativarMiddleware passport', () => {
        roteador.ativarMiddleware('passport', {
            valor: true,
            tipo: 'lógico',
            imutavel: true
        });
        expect(roteador.passport).toBeTruthy()
    })
});