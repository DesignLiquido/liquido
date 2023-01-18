import * as xmlParser from 'fast-xml-parser';
import { PreprocessadorParciais } from "../../../../infraestrutura/preprocessadores/preprocessadorParciais";

const isXML = (xml: string): boolean => {
    try {
        xmlParser.XMLValidator.validate(xml);
        return true;
    } catch (err) {
        return false;
    }
}

describe('Preprocessador de parciais', () => {
    let preProcessador: PreprocessadorParciais;

    beforeEach(() => {
        preProcessador = new PreprocessadorParciais();
    })

    it('Deve tratar o parcial e retorna o xmlContent', () => {
        const texto = `<lmht><corpo><parcial nome="minha-parcial" /></corpo></lmht>`;
        const resultado = preProcessador.processarParciais(texto);
        expect(isXML(resultado as string)).toBeTruthy();
    });
})