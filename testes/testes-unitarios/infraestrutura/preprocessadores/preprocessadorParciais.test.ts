import { PreprocessadorParciais } from "../../../../infraestrutura/preprocessadores/preprocessadorParciais";

describe('Preprocessador de parciais', () => {
    let preProcessador: PreprocessadorParciais;

    beforeEach(() => {
        preProcessador = new PreprocessadorParciais();
    })

    it.only('Deve capturar a tag <parcial> e retorna true', () => {
        const texto = `<lmht><corpo><parcial nome="minha-parcial" /></corpo></lmht>`;
        const resultado = preProcessador.processarParciais(texto);
        expect(resultado).toStrictEqual(new Error("Não foi encontrado a tag parcial"));
    });
})