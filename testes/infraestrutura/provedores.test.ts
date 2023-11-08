import { ProvedorLincones } from '../../infraestrutura/provedores';

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
    provedor.configurar('caminho', 'banco.db');
    const modulo = await provedor.resolver();
    expect(modulo.componentes['executar']).toBeTruthy();
  });
});
