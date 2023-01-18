
import { PreprocessadorParciais } from "../../../../infraestrutura/preprocessadores/preprocessadorParciais";
import { VerificaXml } from "../../../ajudadores/VerificaXml";

describe('Preprocessador de parciais', () => {
    let preProcessador: PreprocessadorParciais;

    beforeEach(() => {
        preProcessador = new PreprocessadorParciais();
    })

    it('Deve tratar o parcial e retorna o xmlContent', () => {
        const texto = `<lmht><corpo><parcial nome="minha-parcial" /></corpo></lmht>`;
        const resultado = preProcessador.processarParciais(texto);
        expect(VerificaXml(resultado as string)).toBeTruthy();
    });
})