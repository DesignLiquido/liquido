import { PreprocessadorFolEs } from '../../../fontes/infraestrutura/preprocessadores';

describe('Testes do preprocessador FolEs', () => {
  let preprocessador: PreprocessadorFolEs;

  beforeEach(() => {
    preprocessador = new PreprocessadorFolEs();
  });

  it('Deve criar um preprocessador', () => {
    expect(preprocessador).toBeTruthy();
  });

  it('Deve processar o preprocessador', async () => {
    const conteudo = '<lmht><cabeca><estilo>corpo { tamanho-fonte: 22px; }</estilo></cabeca></lmht>';
    const resultado = await preprocessador.processar(conteudo);
    const esperado = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<lmht>
  <cabeca>
    <style>    body {
    font-size: 22px;
    }

</style>
  </cabeca>
</lmht>`;
    expect(resultado).toBe(esperado);
  });

  it('Deve processar conteúdo LMHT sem tag cabeca', async () => {
    const conteudo = '<lmht><corpo><p>Olá</p></corpo></lmht>';
    const resultado = await preprocessador.processar(conteudo);
    expect(resultado).toContain('<lmht>');
    expect(resultado).not.toContain('<style>');
  });

  it('Deve rejeitar conteúdo XML inválido', async () => {
    const conteudoInvalido = '<lmht><tag-nao-fechada>';
    await expect(preprocessador.processar(conteudoInvalido)).rejects.toContain('LMHT com problema de conteúdo');
  });

  it('Deve processar conteúdo com tag cabeça (com acento)', async () => {
    const conteudo = '<lmht><cabeça><estilo>corpo { tamanho-fonte: 16px; }</estilo></cabeça></lmht>';
    const resultado = await preprocessador.processar(conteudo);
    expect(resultado).toContain('<style>');
  });

  it('Deve preservar outros filhos de <cabeca> ao converter <estilo> (regressão: shift() descartava irmãos)', async () => {
    const conteudo = '<lmht><cabeca><titulo>Meu Título</titulo><estilo>corpo { tamanho-fonte: 16px; }</estilo></cabeca></lmht>';
    const resultado = await preprocessador.processar(conteudo);
    expect(resultado).toContain('<titulo>Meu Título</titulo>');
    expect(resultado).toContain('<style>');
    // Deve haver apenas uma tag <cabeca>, com os dois filhos dentro dela.
    expect(resultado.match(/<cabeca>/g)?.length).toBe(1);
  });
});
