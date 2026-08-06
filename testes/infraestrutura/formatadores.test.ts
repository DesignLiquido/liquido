import { FormatadorLmht } from '../../fontes/infraestrutura/formatadores';

describe('Testes do formatador LMHT', () => {
  let formatador: FormatadorLmht;

  beforeEach(() => {
    formatador = new FormatadorLmht(process.cwd() + '/testes');
  });

  it('Deve criar um formatador', () => {
    expect(formatador).toBeTruthy();
  });

  it('Deve formatar um arquivo', async () => {
    const resultado = await formatador.formatar('teste', {});
    const esperado = ``;
    expect(resultado).toBe(esperado);
  });

  it('Deve formatar um arquivo com valores não vazios', async () => {
    const resultado = await formatador.formatar('teste', { titulo: 'Teste' });
    expect(resultado).toBe('');
  });

  it('Deve rejeitar quando visão não existe para rota inexistente', async () => {
    await expect(
      formatador.formatar('/rota-inexistente', {})
    ).rejects.toContain('Visão correspondente');
  });

  it('Deve rejeitar quando visão não existe para rota com parâmetro', async () => {
    await expect(
      formatador.formatar('/usuarios/:id', {})
    ).rejects.toContain('Visão correspondente');
  });
});

describe('Testes de layout (base.lmht)', () => {
  let formadorComLayout: FormatadorLmht;

  beforeEach(() => {
    formadorComLayout = new FormatadorLmht(process.cwd() + '/testes/exemplos/layout');
  });

  it('Deve aplicar o base.lmht da raiz de visoes quando a pasta da visão não tem um próprio', async () => {
    const resultado = await formadorComLayout.formatar('/', {});
    expect(resultado).toContain('Nav Raiz');
    expect(resultado).toContain('Pagina Inicial');
    expect(resultado).toContain('Layout Raiz');
  });

  it('Deve mesclar o <cabeca> da visão com o <cabeca> do layout', async () => {
    const resultado = await formadorComLayout.formatar('/', {});
    expect(resultado).toContain('Layout Raiz');
    expect(resultado).toContain('font-size');
  });

  it('Deve usar o base.lmht mais próximo, sobrescrevendo o da pasta ancestral', async () => {
    const resultado = await formadorComLayout.formatar('/comlayoutproprio', {});
    expect(resultado).toContain('Nav Propria');
    expect(resultado).toContain('Layout Proprio');
    expect(resultado).toContain('Pagina Filha');
    expect(resultado).not.toContain('Nav Raiz');
    expect(resultado).not.toContain('Layout Raiz');
  });

  it('Deve rejeitar quando o base.lmht não contém o marcador <conteudo/>', async () => {
    await expect(
      formadorComLayout.formatar('/semplaceholder', {})
    ).rejects.toThrow("não contém o marcador '<conteudo/>'");
  });
});
