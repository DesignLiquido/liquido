import * as sistemaArquivos from 'fs';
import { GeradorInicializacaoLincones } from '../../fontes/interface-linha-comando/gerar/gerador-inicializacao-lincones';
import { Classe } from '@designliquido/delegua/declaracoes';

jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    appendFileSync: jest.fn()
}));

function mockModelo(nome: string, propriedades: Array<{ lexema: string; tipo: string; decoradores?: any[] }>): Classe {
    return {
        simbolo: { lexema: nome },
        propriedades: propriedades.map((p) => ({
            nome: { lexema: p.lexema },
            tipo: p.tipo,
            decoradores: p.decoradores ?? []
        }))
    } as unknown as Classe;
}

describe('GeradorInicializacaoLincones', () => {
    let gerador: GeradorInicializacaoLincones;
    const caminhoArquivo = '/projeto/inicializacao.lincones';

    beforeEach(() => {
        jest.clearAllMocks();
        gerador = new GeradorInicializacaoLincones();
    });

    it('cria novo arquivo quando não existe', () => {
        (sistemaArquivos.existsSync as jest.Mock).mockReturnValue(false);
        const modelo = mockModelo('Artigo', [
            { lexema: 'id', tipo: 'numero' },
            { lexema: 'titulo', tipo: 'texto' }
        ]);

        gerador.acrescentarCriarTabela(modelo, caminhoArquivo);

        expect(sistemaArquivos.writeFileSync).toHaveBeenCalledTimes(1);
        const conteudo = (sistemaArquivos.writeFileSync as jest.Mock).mock.calls[0][1] as string;
        expect(conteudo).toContain('CRIAR TABELA');
        expect(conteudo).toContain('SE NÃO EXISTIR');
        expect(conteudo).toContain('artigos');
        expect(conteudo).toContain('id');
        expect(conteudo).toContain('CHAVE PRIMÁRIA');
        expect(conteudo).toContain('AUTO INCREMENTO');
    });

    it('acrescenta ao arquivo existente quando a tabela ainda não está presente', () => {
        (sistemaArquivos.existsSync as jest.Mock).mockReturnValue(true);
        (sistemaArquivos.readFileSync as jest.Mock).mockReturnValue(
            'CRIAR TABELA SE NÃO EXISTIR usuarios (\n    id INTEIRO CHAVE PRIMÁRIA AUTO INCREMENTO\n);'
        );
        const modelo = mockModelo('Artigo', [
            { lexema: 'id', tipo: 'numero' },
            { lexema: 'titulo', tipo: 'texto' }
        ]);

        gerador.acrescentarCriarTabela(modelo, caminhoArquivo);

        expect(sistemaArquivos.appendFileSync).toHaveBeenCalledTimes(1);
        const conteudo = (sistemaArquivos.appendFileSync as jest.Mock).mock.calls[0][1] as string;
        expect(conteudo).toContain('artigos');
    });

    it('não altera o arquivo quando a tabela já está presente (idempotência)', () => {
        (sistemaArquivos.existsSync as jest.Mock).mockReturnValue(true);
        (sistemaArquivos.readFileSync as jest.Mock).mockReturnValue(
            'CRIAR TABELA SE NÃO EXISTIR artigos (\n    id INTEIRO CHAVE PRIMÁRIA AUTO INCREMENTO\n);'
        );
        const modelo = mockModelo('Artigo', [{ lexema: 'id', tipo: 'numero' }]);

        gerador.acrescentarCriarTabela(modelo, caminhoArquivo);

        expect(sistemaArquivos.writeFileSync).not.toHaveBeenCalled();
        expect(sistemaArquivos.appendFileSync).not.toHaveBeenCalled();
    });

    it('usa campo com decorador @chave como chave primária', () => {
        (sistemaArquivos.existsSync as jest.Mock).mockReturnValue(false);
        const modelo = mockModelo('Produto', [
            { lexema: 'codigo', tipo: 'numero', decoradores: [{ nome: '@chave' }] },
            { lexema: 'nome', tipo: 'texto' }
        ]);

        gerador.acrescentarCriarTabela(modelo, caminhoArquivo);

        const conteudo = (sistemaArquivos.writeFileSync as jest.Mock).mock.calls[0][1] as string;
        expect(conteudo).toContain('codigo');
        expect(conteudo).toContain('CHAVE PRIMÁRIA');
    });

    it('mapeia tipo logico para LOGICO', () => {
        (sistemaArquivos.existsSync as jest.Mock).mockReturnValue(false);
        const modelo = mockModelo('Config', [
            { lexema: 'id', tipo: 'numero' },
            { lexema: 'ativo', tipo: 'logico' }
        ]);

        gerador.acrescentarCriarTabela(modelo, caminhoArquivo);

        const conteudo = (sistemaArquivos.writeFileSync as jest.Mock).mock.calls[0][1] as string;
        expect(conteudo).toContain('LOGICO');
    });

    it('mapeia tipo caracteres para CARACTERES', () => {
        (sistemaArquivos.existsSync as jest.Mock).mockReturnValue(false);
        const modelo = mockModelo('Endereco', [
            { lexema: 'id', tipo: 'numero' },
            { lexema: 'cep', tipo: 'caracteres' }
        ]);

        gerador.acrescentarCriarTabela(modelo, caminhoArquivo);

        const conteudo = (sistemaArquivos.writeFileSync as jest.Mock).mock.calls[0][1] as string;
        expect(conteudo).toContain('CARACTERES');
    });
});
