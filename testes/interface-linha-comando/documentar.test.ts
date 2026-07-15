import * as sistemaArquivos from 'fs';
import * as so from 'os';
import caminho from 'path';

import { documentar } from '../../fontes/interface-linha-comando/documentar';

/**
 * Testes de regressão para o achado M7 (issue #114):
 * `liquido documentar` não pode terminar em silêncio. Todo desfecho
 * deve ser reportado explicitamente no console — o arquivo gerado e
 * seu caminho, ou o motivo de nenhum arquivo ter sido gerado.
 */
describe('Comando documentar', () => {
    let diretorioTemporario: string;
    let espiaoConsole: jest.SpyInstance;
    let espiaoCwd: jest.SpyInstance;

    const saidaConsole = (): string =>
        espiaoConsole.mock.calls.map((chamada) => String(chamada[0])).join('\n');

    beforeEach(() => {
        diretorioTemporario = sistemaArquivos.mkdtempSync(
            caminho.join(so.tmpdir(), 'liquido-documentar-')
        );
        espiaoConsole = jest.spyOn(console, 'log').mockImplementation(() => {});
        espiaoCwd = jest.spyOn(process, 'cwd').mockReturnValue(diretorioTemporario);
    });

    afterEach(() => {
        espiaoConsole.mockRestore();
        espiaoCwd.mockRestore();
        sistemaArquivos.rmSync(diretorioTemporario, { recursive: true, force: true });
    });

    it('deve reportar explicitamente quando nenhuma rota é encontrada e não gerar arquivo', async () => {
        await documentar();

        const saida = saidaConsole();
        expect(saida).toContain('Nenhum arquivo de rota');
        expect(saida).toContain(caminho.join(diretorioTemporario, 'rotas').replace(/\\/gi, '/'));
        expect(saida).toContain('Nenhum arquivo de documentação foi gerado.');

        expect(
            sistemaArquivos.existsSync(caminho.join(diretorioTemporario, 'openapi.json'))
        ).toBe(false);
    });

    it('deve gerar openapi.json e reportar caminho e número de rotas', async () => {
        const diretorioRota = caminho.join(diretorioTemporario, 'rotas', 'artigos');
        sistemaArquivos.mkdirSync(diretorioRota, { recursive: true });
        sistemaArquivos.writeFileSync(
            caminho.join(diretorioRota, 'inicial.delegua'),
            [
                'liquido.rotaGet(funcao(requisicao, resposta) {',
                '    resposta.json([])',
                '})'
            ].join('\n')
        );

        await documentar();

        const caminhoSaida = caminho.join(diretorioTemporario, 'openapi.json');
        expect(sistemaArquivos.existsSync(caminhoSaida)).toBe(true);

        const documento = JSON.parse(sistemaArquivos.readFileSync(caminhoSaida, 'utf-8'));
        expect(documento.openapi).toBe('3.0.0');
        expect(Object.keys(documento.paths)).toHaveLength(1);
        expect(documento.paths['/artigos/']).toBeDefined();

        const saida = saidaConsole();
        expect(saida).toContain('Documentação OpenAPI gerada com 1 rota(s) em:');
        expect(saida).toContain(caminhoSaida);
        // Erros de análise acumulados não podem mais ser engolidos em silêncio.
        expect(saida).toContain('Aviso:');
    });

    it('deve gravar no caminho de saída informado quando fornecido', async () => {
        const diretorioRota = caminho.join(diretorioTemporario, 'rotas');
        sistemaArquivos.mkdirSync(diretorioRota, { recursive: true });
        sistemaArquivos.writeFileSync(
            caminho.join(diretorioRota, 'inicial.delegua'),
            'liquido.rotaGet(funcao(requisicao, resposta) {\n    resposta.json([])\n})'
        );

        const caminhoPersonalizado = caminho.join(diretorioTemporario, 'docs.json');
        await documentar(caminhoPersonalizado);

        expect(sistemaArquivos.existsSync(caminhoPersonalizado)).toBe(true);
        expect(saidaConsole()).toContain(caminhoPersonalizado);
    });
});
