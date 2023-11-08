import { FormatadorLmht } from '../../../infraestrutura/formatadores';

describe('Testes do formatador LMHT', () => {
  let formatador: FormatadorLmht;

  beforeEach(() => {
    formatador = new FormatadorLmht(process.cwd() + '/testes/testes-unitarios');
  });

  it('Deve criar um formatador', () => {
    expect(formatador).toBeTruthy();
  });

  it('Deve formatar um arquivo', async () => {
    const resultado = await formatador.formatar('teste', {});
    const esperado = ``;
    expect(resultado).toBe(esperado);
  });
});
