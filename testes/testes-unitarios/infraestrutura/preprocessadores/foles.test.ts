import { PreprocessadorFolEs } from '../../../../infraestrutura/preprocessadores';

describe('Testes do preprocessador FolEs', () => {
  let preprocessador: PreprocessadorFolEs;

  beforeEach(() => {
    preprocessador = new PreprocessadorFolEs();
  });

  it('Deve criar um preprocessador', () => {
    expect(preprocessador).toBeTruthy();
  });

  it('Deve processar o preprocessador', () => {
    const conteudo = '<lmht><cabeca><estilo>corpo { tamanho-fonte: 22px; }</estilo></cabeca></lmht>';
    const resultado = preprocessador.processar(conteudo);
    const esperado = `<lmht><cabeca><style>body {
  font-size: 22px;
}

</style></cabeca></lmht>`;
    expect(resultado).toBe(esperado);
  });
});
