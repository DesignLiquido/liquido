import * as sistemaArquivos from 'fs';
import * as so from 'os';
import caminho from 'path';

import {
    copiarArquivosDeExemploParaNovoProjeto,
    criarDiretorioAplicacao,
    validarTipoProjeto,
    validarLinguagem,
    validarGerenciadorDePacotes
} from '../../fontes/interface-linha-comando/novo';

/**
 * Testes de regressão para o achado A4 (issue #103):
 * o scaffold MVC não pode gerar um projeto sem código executável.
 * Todo template deve entregar, no mínimo, uma rota inicial, uma visão
 * inicial e um estilo inicial, para que `npx liquido` responda com uma
 * página de boas-vindas no primeiro boot.
 */
describe('Comando novo - cópia de arquivos de exemplo', () => {
    let diretorioTemporario: string;

    beforeEach(() => {
        diretorioTemporario = sistemaArquivos.mkdtempSync(
            caminho.join(so.tmpdir(), 'liquido-novo-')
        );
    });

    afterEach(() => {
        sistemaArquivos.rmSync(diretorioTemporario, { recursive: true, force: true });
    });

    const casosMvc: [string, string][] = [
        ['delegua', 'inicial.delegua'],
        ['pitugues', 'inicial.pitu']
    ];

    it.each(casosMvc)(
        'projeto MVC em %s deve conter rota, visão e estilo iniciais',
        async (linguagem: string, arquivoRota: string) => {
            await copiarArquivosDeExemploParaNovoProjeto(
                'meu-projeto',
                'mvc',
                linguagem,
                diretorioTemporario
            );

            const arquivosEsperados = [
                caminho.join(diretorioTemporario, 'rotas', arquivoRota),
                caminho.join(diretorioTemporario, 'visoes', 'inicial.lmht'),
                caminho.join(diretorioTemporario, 'estilos', 'principal.foles'),
                caminho.join(diretorioTemporario, 'configuracao.delprops')
            ];

            for (const arquivoEsperado of arquivosEsperados) {
                expect(sistemaArquivos.existsSync(arquivoEsperado)).toBe(true);
                const conteudo = sistemaArquivos.readFileSync(arquivoEsperado, 'utf-8');
                expect(conteudo.trim().length).toBeGreaterThan(0);
            }

            // A rota inicial deve renderizar a visão (padrão MVC), e não texto puro.
            const conteudoRota = sistemaArquivos.readFileSync(
                caminho.join(diretorioTemporario, 'rotas', arquivoRota),
                'utf-8'
            );
            expect(conteudoRota).toContain('liquido.rotaGet');
            expect(conteudoRota).toContain('resposta.lmht');
        }
    );

    it.each([['delegua', 'inicial.delegua'], ['pitugues', 'inicial.pitu']])(
        'projeto API REST em %s deve continuar contendo rota inicial',
        async (linguagem: string, arquivoRota: string) => {
            await copiarArquivosDeExemploParaNovoProjeto(
                'meu-projeto',
                'api-rest',
                linguagem,
                diretorioTemporario
            );

            expect(
                sistemaArquivos.existsSync(
                    caminho.join(diretorioTemporario, 'rotas', arquivoRota)
                )
            ).toBe(true);
        }
    );
});

describe('Comando novo - validação de flags (modo não-interativo)', () => {
    describe('validarTipoProjeto', () => {
        it('deve aceitar "mvc"', () => {
            expect(validarTipoProjeto('mvc')).toBe(true);
        });

        it('deve aceitar "api-rest"', () => {
            expect(validarTipoProjeto('api-rest')).toBe(true);
        });

        it('deve rejeitar string vazia', () => {
            expect(validarTipoProjeto('')).toBe(false);
        });

        it('deve rejeitar valor inválido', () => {
            expect(validarTipoProjeto('grpc')).toBe(false);
        });

        it('deve rejeitar undefined', () => {
            expect(validarTipoProjeto(undefined)).toBe(false);
        });

        it('deve funcionar como type guard', () => {
            const valor: string | undefined = 'mvc';

            if (validarTipoProjeto(valor)) {
                const tipo: 'mvc' | 'api-rest' = valor;
                expect(tipo).toBe('mvc');
            }
        });
    });

    describe('validarLinguagem', () => {
        it('deve aceitar "delegua"', () => {
            expect(validarLinguagem('delegua')).toBe(true);
        });

        it('deve aceitar "pitugues"', () => {
            expect(validarLinguagem('pitugues')).toBe(true);
        });

        it('deve rejeitar string vazia', () => {
            expect(validarLinguagem('')).toBe(false);
        });

        it('deve rejeitar valor inválido', () => {
            expect(validarLinguagem('python')).toBe(false);
        });

        it('deve rejeitar undefined', () => {
            expect(validarLinguagem(undefined)).toBe(false);
        });

        it('deve funcionar como type guard', () => {
            const valor: string | undefined = 'delegua';

            if (validarLinguagem(valor)) {
                const lang: 'delegua' | 'pitugues' = valor;
                expect(lang).toBe('delegua');
            }
        });
    });

    describe('validarGerenciadorDePacotes', () => {
        it('deve aceitar "npm"', () => {
            expect(validarGerenciadorDePacotes('npm')).toBe(true);
        });

        it('deve aceitar "yarn"', () => {
            expect(validarGerenciadorDePacotes('yarn')).toBe(true);
        });

        it('deve aceitar "bun"', () => {
            expect(validarGerenciadorDePacotes('bun')).toBe(true);
        });

        it('deve rejeitar string vazia', () => {
            expect(validarGerenciadorDePacotes('')).toBe(false);
        });

        it('deve rejeitar valor inválido', () => {
            expect(validarGerenciadorDePacotes('pnpm')).toBe(false);
        });

        it('deve rejeitar undefined', () => {
            expect(validarGerenciadorDePacotes(undefined)).toBe(false);
        });

        it('deve funcionar como type guard', () => {
            const valor: string | undefined = 'npm';

            if (validarGerenciadorDePacotes(valor)) {
                const gerenciador: 'npm' | 'yarn' | 'bun' = valor;
                expect(gerenciador).toBe('npm');
            }
        });
    });
});

describe('Comando novo - criarDiretorioAplicacao', () => {
    let cwdOriginal: string;
    let diretorioTemporario: string;

    beforeAll(() => {
        cwdOriginal = process.cwd();
    });

    beforeEach(() => {
        diretorioTemporario = sistemaArquivos.mkdtempSync(
            caminho.join(so.tmpdir(), 'liquido-novo-dir-')
        );
        process.chdir(diretorioTemporario);
    });

    afterEach(() => {
        process.chdir(cwdOriginal);
        sistemaArquivos.rmSync(
            diretorioTemporario,
            { recursive: true, force: true }
        );
    });

    it('deve criar diretório quando não existe', () => {
        const resultado = criarDiretorioAplicacao('meu-app');
        const caminhoEsperado = caminho.join(diretorioTemporario, 'meu-app');

        expect(resultado).toBe(caminhoEsperado);
        expect(sistemaArquivos.existsSync(caminhoEsperado)).toBe(true);
        expect(sistemaArquivos.statSync(caminhoEsperado).isDirectory()).toBe(true);
    });

    it('não deve lançar erro quando diretório já existe', () => {
        const caminhoApp = caminho.join(diretorioTemporario, 'app-existente');
        sistemaArquivos.mkdirSync(caminhoApp);

        expect(() => criarDiretorioAplicacao('app-existente')).not.toThrow();
        expect(sistemaArquivos.existsSync(caminhoApp)).toBe(true);
    });

    it('deve retornar caminho absoluto do diretório', () => {
        const resultado = criarDiretorioAplicacao('app-simples');

        expect(caminho.isAbsolute(resultado)).toBe(true);
        expect(resultado.endsWith('app-simples')).toBe(true);
        expect(sistemaArquivos.existsSync(resultado)).toBe(true);
    });
});
