import * as sistemaArquivos from 'fs';
import * as so from 'os';
import caminho from 'path';

import { copiarArquivosDeExemploParaNovoProjeto } from '../../fontes/interface-linha-comando/novo';

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
