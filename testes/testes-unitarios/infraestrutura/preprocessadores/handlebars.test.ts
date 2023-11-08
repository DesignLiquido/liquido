import { PreprocessadorHandlebars } from '../../../../infraestrutura/preprocessadores';

describe('Testes do preprocessador Handlebars', () => {
  let preprocessador: PreprocessadorHandlebars;

  beforeEach(() => {
    preprocessador = new PreprocessadorHandlebars();
  });

  it('Deve criar um preprocessador', () => {
    expect(preprocessador).toBeTruthy();
  });

  it('Deve processar o preprocessador', () => {
    const conteudo = '{{#cada}}\n{{/cada}}';
    const resultado = preprocessador.processar(conteudo);
    expect(resultado).toEqual('{{#each}}\n{{/each}}');
  });
});
