import { ProvedorLincones } from '../../fontes/infraestrutura/provedores';

jest.mock('@designliquido/lincones-sqlite', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(function () {
        this.iniciar = jest.fn().mockResolvedValue(undefined);
        this.executar = jest.fn();
        this.executarComando = jest.fn();
    }),
}));

describe('Testes do provedor Lincones', () => {
  let provedor: ProvedorLincones;

  beforeEach(() => {
    provedor = new ProvedorLincones();
  });

  it('Deve criar um provedor', () => {
    expect(provedor).toBeTruthy();
  });

  it('Deve configurar o provedor', () => {
    provedor.configurar('tecnologia', 'sqlite');
    provedor.configurar('caminho', 'banco.db');
    expect(provedor.configurado).toBeTruthy();
  });

  it('Deve resolver o provedor', async () => {
    provedor.configurar('tecnologia', 'sqlite');
    provedor.configurar('caminho', ':memory:');
    const modulo = await provedor.resolver();
    expect(modulo.componentes['executar']).toBeTruthy();
  });
});
