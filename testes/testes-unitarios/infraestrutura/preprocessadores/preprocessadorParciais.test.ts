import { PreprocessadorParciais } from "../../../../infraestrutura/preprocessadores/preprocessadorParciais";

describe('Preprocessador de parciais', () => {
    let preprocessador: PreprocessadorParciais;

    beforeEach(() => {
        preprocessador = new PreprocessadorParciais();
    })

    it('Deve capturar a tag <parcial> e retorna true', () => {
        const texto = '<parcial>teste</parcial>';
        const resultado = preprocessador.processarParciais(texto);
        expect(resultado).toBe(true);
    });
})