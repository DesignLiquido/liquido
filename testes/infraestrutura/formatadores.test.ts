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
