import { PreprocessadorParciais } from "../../../../infraestrutura/preprocessadores/preprocessadorParciais";

describe('Preprocessador de parciais', () => {
    let preProcessador: PreprocessadorParciais;

    beforeEach(() => {
        preProcessador = new PreprocessadorParciais();
    })

    it.only('Deve capturar a tag <parcial> e retorna true', () => {
        const texto = "<lmht><corpo><parcial>teste</parcial></corpo></lmht>";
        const resultado = preProcessador.processarParciais(texto);
        // TODO: @ItaloCobains Ajustar os expect do teste.
        expect(resultado).toBe('');
    });
})