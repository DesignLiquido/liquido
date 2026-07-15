import { AutoDocumentador } from '../../fontes/infraestrutura/auto-documentacao/auto-documentador';
import { Roteador } from '../../fontes/infraestrutura/roteador';

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

  it('deve ignorar a porta do ambiente e usar o valor padrão até que a configuração seja aplicada', () => {
    process.env.PORT = '4000';

    const roteadorSemConfiguracao = new Roteador(new AutoDocumentador());

    expect(roteadorSemConfiguracao.porta).toBe(3000);

    delete process.env.PORT;
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
    roteador.passport = false;
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

  it('deve definir cors via ativarDesativarCors', () => {
    roteador.ativarDesativarCors(true);
    expect(roteador.cors).toBe(true);
  });

  it('deve definir passport via ativarDesativarPassport', () => {
    roteador.ativarDesativarPassport(true);
    expect(roteador.passport).toBe(true);
  });

  it('deve definir cookieParser via ativarDesativarCookieParser', () => {
    roteador.ativarDesativarCookieParser(true);
    expect(roteador.cookieParser).toBe(true);
  });

  it('deve definir expressJson via ativarDesativarExpressJson', () => {
    roteador.ativarDesativarExpressJson(true);
    expect(roteador.expressJson).toBe(true);
  });

  it('deve definir bodyParser via ativarDesativarBodyParser', () => {
    roteador.ativarDesativarBodyParser(true);
    expect(roteador.bodyParser).toBe(true);
  });

  it('deve definir helmet via ativarDesativarHelmet', () => {
    roteador.ativarDesativarHelmet(true);
    expect(roteador.helmet).toBe(true);
  });

  it('deve definir morgan via ativarDesativarMorgan', () => {
    roteador.ativarDesativarMorgan(true);
    expect(roteador.morgan).toBe(true);
  });

  describe('validarToken', () => {
    it('deve retornar 401 quando token não está presente no cabeçalho', () => {
      const req = { headers: {} } as any;
      const res = { sendStatus: jest.fn() } as any;
      const next = jest.fn();
      roteador.validarToken(req, res, next);
      expect(res.sendStatus).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('deve retornar 401 quando token é inválido', () => {
      const req = { headers: { authorization: 'token-invalido' } } as any;
      const res = { sendStatus: jest.fn() } as any;
      const next = jest.fn();
      roteador.validarToken(req, res, next);
      expect(res.sendStatus).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
