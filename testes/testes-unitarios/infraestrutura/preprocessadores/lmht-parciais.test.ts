
import { PreprocessadorLmhtParciais } from "../../../../infraestrutura/preprocessadores/lmht-parciais";
import { VerificaXml } from "../../../ajudadores/VerificaXml";

describe('Preprocessador de parciais em LMHT', () => {
    let preProcessador: PreprocessadorLmhtParciais;

    beforeEach(() => {
        preProcessador = new PreprocessadorLmhtParciais();
    })

    it('Deve tratar o parcial e retorna o xmlContent', () => {
        const texto = `<lmht><corpo><parcial nome="minha-parcial" /></corpo></lmht>`;
        const resultado = preProcessador.processarParciais(texto);
        expect(VerificaXml(resultado as string)).toBeTruthy();
    });

    it('Deve retornar um Error por não encontrar a tag <corpo> </corpo>' ,() => {
        const texto = `<lmht></lmht>`;
        const resultado = preProcessador.processarParciais(texto);
        expect(resultado).toBeInstanceOf(Error);
        expect((resultado as Error)?.message).toBe("Não foi encontrado a tag corpo");
    })

    it('Deve retornar um Error por não encontrar a tag <parcial> </parcial>' ,() => {
        const texto = `<lmht><corpo></corpo></lmht>`;
        const resultado = preProcessador.processarParciais(texto);
        expect(resultado).toBeInstanceOf(Error);
        expect((resultado as Error)?.message).toBe("Não foi encontrado a tag parcial");
    })

    it('Deve retornar um Error por não encontrar o atributo nome' ,() => {
        const texto = `<lmht><corpo><parcial /></corpo></lmht>`;
        const resultado = preProcessador.processarParciais(texto);
        expect(resultado).toBeInstanceOf(Error);
        expect((resultado as Error)?.message).toBe("Em Parcial o atributo nome não foi informado");
    })

    it('Deve retornar um Error por não encontrar o diretorio error' ,() => {
        const texto = `<lmht><corpo><parcial nome="error" /></corpo></lmht>`;

        jest.spyOn(preProcessador, 'DiretorioParcialGetter', 'get').mockReturnValue('error')

        const resultado = preProcessador.processarParciais(texto);
        expect(resultado).toBeInstanceOf(Error);
        expect((resultado as Error)?.message).toBe("O diretorio error não foi encontrado");
    })

    it('Deve retornar um Error por não encontrar o arquivo parcial' ,() => {
        const texto = `<lmht><corpo><parcial nome="error" /></corpo></lmht>`;
        const resultado = preProcessador.processarParciais(texto);
        expect(resultado).toBeInstanceOf(Error);
        expect((resultado as Error)?.message).toBe("O arquivo error.lmht não foi encontrado");
    })
})