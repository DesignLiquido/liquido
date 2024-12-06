import { AutoDocumentador } from '../../../infraestrutura/auto-documentacao/auto-documentador';
import { Roteador } from '../../../infraestrutura/roteador';

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
    roteador = new Roteador(new AutoDocumentador());
  });

  it('Deve criar um roteador', () => {
    expect(roteador).toBeTruthy();
  });

  it('deve chamar o método iniciar', () => {
    roteador.iniciar();
    expect(roteador.aplicacao.listen).toHaveBeenCalled();
  });

  it('deve chamar o método post para adicionandoRotaToken', () => {
    roteador.adicionarRotaToken();
    expect(roteador.aplicacao.post).toHaveBeenCalled();
  });

  it('deve chamar o metodo iniciarMiddlewares', () => {
    const spy = jest.spyOn(roteador, 'iniciarMiddlewares');
    roteador.iniciarMiddlewares();
    expect(spy).toHaveBeenCalled();
  });

  it('deve chamar this.aplicacao.use no método iniciarMiddlewares', () => {
    roteador.morgan = true;
    roteador.helmet = true;
    roteador.bodyParser = true;
    // FIXME - TypeError: express_1.default.json is not a function
    // roteador.expressJson = true;
    roteador.cookieParser = true;
    roteador.cors = true;
    roteador.passport = true;
    roteador.iniciarMiddlewares();
    expect(roteador.aplicacao.use).toHaveBeenCalled();
  });

  it('deve chamar this.aplicacao.get no método rotaGet', () => {
    roteador.rotaGet('teste', () => null);
    expect(roteador.aplicacao.get).toHaveBeenCalled();
  });

  it('deve chamar this.aplicacao.post no método rotaPost', () => {
    roteador.rotaPost('teste', () => null);
    expect(roteador.aplicacao.post).toHaveBeenCalled();
  });

  it('deve chamar this.aplicacao.put no método rotaPut', () => {
    roteador.rotaPut('teste', () => null);
    expect(roteador.aplicacao.put).toHaveBeenCalled();
  });

  it('deve chamar this.aplicacao.patch no método rotaPatch', () => {
    roteador.rotaPatch('teste', () => null);
    expect(roteador.aplicacao.patch).toHaveBeenCalled();
  });

  it('deve chamar this.aplicacao.delete no método rotaDelete', () => {
    roteador.rotaDelete('teste', () => null);
    expect(roteador.aplicacao.delete).toHaveBeenCalled();
  });

  it('deve chamar this.aplicacao.options no método rotaOptions', () => {
    roteador.rotaOptions('teste', () => null);
    expect(roteador.aplicacao.options).toHaveBeenCalled();
  });

  it('deve chamar this.aplicacao.copy no método rotaCopy', () => {
    roteador.rotaCopy('teste', () => null);
    expect(roteador.aplicacao.copy).toHaveBeenCalled();
  });

  it('deve chamar this.aplicacao.head no método rotaHead', () => {
    roteador.rotaHead('teste', () => null);
    expect(roteador.aplicacao.head).toHaveBeenCalled();
  });

  it('deve chamar this.aplicacao.lock no método rotaLock', () => {
    roteador.rotaLock('teste', () => null);
    expect(roteador.aplicacao.lock).toHaveBeenCalled();
  });

  it('deve chamar this.aplicacao.unlock no método rotaUnlock', () => {
    roteador.rotaUnlock('teste', () => null);
    expect(roteador.aplicacao.unlock).toHaveBeenCalled();
  });

  it('deve chamar this.aplicacao.purge no método rotaPurge', () => {
    roteador.rotaPurge('teste', () => null);
    expect(roteador.aplicacao.purge).toHaveBeenCalled();
  });

  it('deve chamar this.aplicacao.propfind no método rotaPropfind', () => {
    roteador.rotaPropfind('teste', () => null);
    expect(roteador.aplicacao.propfind).toHaveBeenCalled();
  });
});
