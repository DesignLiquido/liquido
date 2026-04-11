import { PreprocessadorLmhtParciais } from '../../../fontes/infraestrutura/preprocessadores/lmht-parciais';
import { verificarXml } from '../../ajudadores/verificar-xml';

describe('Preprocessador de parciais em LMHT', () => {
    let preProcessador: PreprocessadorLmhtParciais;

    beforeEach(() => {
        preProcessador = new PreprocessadorLmhtParciais();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('Deve tratar o parcial e retorna o xmlContent', () => {
        const texto = `<lmht><corpo><parcial nome="minha-parcial" /></corpo></lmht>`;
        jest.spyOn(preProcessador as any, 'buscarDiretorioOuArquivo').mockReturnValue(true);
        jest.spyOn(preProcessador as any, 'obterConteudoDoArquivoParcial').mockReturnValue({ parcial: {} });
        const resultado = preProcessador.processarParciais(texto);
        if (resultado instanceof Error) {
            throw resultado;
        }
        expect(verificarXml(resultado.xmlContent as string)).toBeTruthy();
    });

    it('Deve retornar um Error por não encontrar a tag <corpo> </corpo>', () => {
        const texto = `<lmht></lmht>`;
        const resultado = preProcessador.processarParciais(texto);
        expect(resultado).toBeInstanceOf(Error);
        expect((resultado as Error)?.message).toBe('Não foi encontrada uma estrutura de corpo para a parcial.');
    });

    it('Deve retornar um Error por não encontrar a tag <parcial> </parcial>', () => {
        const texto = `<lmht><corpo></corpo></lmht>`;
        const resultado = preProcessador.processarParciais(texto);
        expect(resultado).toBeInstanceOf(Error);
        expect((resultado as Error)?.message).toBe('Não foi encontrada uma estrutura parcial.');
    });

    it('Deve retornar um Error por não encontrar o atributo nome', () => {
        const texto = `<lmht><corpo><parcial /></corpo></lmht>`;
        const resultado = preProcessador.processarParciais(texto);
        expect(resultado).toBeInstanceOf(Error);
        expect((resultado as Error)?.message).toBe("Na estrutura parcial, o atributo 'nome' não foi informado.");
    });

    it('Deve retornar um Error por não encontrar o diretorio error', () => {
        const texto = `<lmht><corpo><parcial nome="error" /></corpo></lmht>`;

        jest.spyOn(preProcessador, 'diretorioParcial', 'get').mockReturnValue('error');

        const resultado = preProcessador.processarParciais(texto);
        expect(resultado).toBeInstanceOf(Error);
        expect((resultado as Error)?.message).toBe("O diretório 'error' não foi encontrado.");
    });

    it('Deve retornar um Error por não encontrar o arquivo parcial', () => {
        const texto = `<lmht><corpo><parcial nome="error" /></corpo></lmht>`;
        jest.spyOn(preProcessador as any, 'buscarDiretorioOuArquivo')
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(false);
        const resultado = preProcessador.processarParciais(texto);
        expect(resultado).toBeInstanceOf(Error);
        expect((resultado as Error)?.message).toBe("O arquivo 'error.lmht' não foi encontrado.");
    });
});
