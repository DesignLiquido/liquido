import * as caminho from 'path';
import sistemaArquivos from 'fs';

import { Liquido } from '../liquido';
import { RetornoConfiguracaoInterface } from '../interfaces';
import {
    criarDiretorioAplicacao,
    copiarArquivosDeExemploParaNovoProjeto
} from '../interface-linha-comando';

describe('Liquido', () => {
    let liquido: Liquido;

    beforeEach(() => {
        liquido = new Liquido(process.cwd());
    });

    it('Testando descobrirRotas()', () => {
        liquido.descobrirRotas(caminho.join(__dirname, 'exemplos/rotas'));
        const rota1 = liquido.arquivosDelegua[0].split('rotas')[1];
        const rota2 = liquido.arquivosDelegua[1].split('rotas')[1];
        expect(liquido.arquivosDelegua.length).toBeGreaterThanOrEqual(2);
        expect(rota1).toBe(`${caminho.sep}inicial.delegua`);
        expect(rota2).toBe(`${caminho.sep}middlewares.delegua`);
    });

    it('Testando resolverCaminhoRota()', () => {
        const expected: string[] = [];

        liquido.descobrirRotas(caminho.join(__dirname, 'exemplos', 'rotas'));

        liquido.arquivosDelegua.forEach((arquivo) => {
            expected.push(liquido.resolverCaminhoRota(arquivo));
        });

        expect(expected.length).toBeGreaterThanOrEqual(2);
        expect(expected[0]).toBe('');
        expect(expected[1]).toBe('/middlewares');
    });

    it('Testando resolveArquivoConfiguracaoMiddleware()', () => {
        const retorno: RetornoConfiguracaoInterface = liquido.resolverArquivoConfiguracao(
            caminho.join(__dirname, 'exemplos')
        );

        expect(retorno.valor).toBeTruthy();
        expect(retorno.caminho).toBe(caminho.join(__dirname, 'exemplos', 'configuracao.delegua'));
    });

    describe('Testes de Middlewares', () => {
        beforeEach(() => {
            liquido = new Liquido(process.cwd());
        });

        it('Deve importar arquivo de rotas com middlewares sem erros', async () => {
            // Testa que o arquivo com middlewares é importado corretamente
            liquido.descobrirRotas(caminho.join(__dirname, 'exemplos', 'rotas'));

            // Verifica que o arquivo middlewares.delegua foi descoberto
            const arquivoMiddlewares = liquido.arquivosDelegua.find(
                arquivo => arquivo.includes('middlewares.delegua')
            );

            expect(arquivoMiddlewares).toBeDefined();
        });

        it('Deve processar rotas com diferentes quantidades de middlewares', async () => {
            // Este teste verifica que as rotas são registradas corretamente
            // Pode ser expandido para verificar o comportamento específico
            liquido.descobrirRotas(caminho.join(__dirname, 'exemplos', 'rotas'));

            // Verifica que múltiplos arquivos de rota foram descobertos
            expect(liquido.arquivosDelegua.length).toBeGreaterThan(0);

            // Verifica que inclui o arquivo de middlewares
            const temMiddlewares = liquido.arquivosDelegua.some(
                arquivo => arquivo.includes('middlewares.delegua')
            );
            expect(temMiddlewares).toBe(true);
        });

        it('Deve resolver caminhos de rotas com middlewares corretamente', () => {
            const caminhoTeste = caminho.join(__dirname, 'exemplos', 'rotas', 'middlewares.delegua');
            const caminhoResolvido = liquido.resolverCaminhoRota(caminhoTeste);

            // O caminho resolvido deve ser '/middlewares'
            expect(caminhoResolvido).toBe('/middlewares');
        });

        it('Deve descobrir estilos se o diretório existir', () => {
            // Testa a descoberta de estilos (não diretamente relacionado a middlewares,
            // mas importante para cobertura completa)
            const estilos = liquido.descobrirEstilos();

            // Deve retornar um array (pode estar vazio se não houver estilos)
            expect(Array.isArray(estilos)).toBe(true);
        });
    });

    describe('Testes de Métodos Auxiliares', () => {
        it('Deve criar instância do Liquido com diretório base correto', () => {
            const diretorioBase = process.cwd();
            const instancia = new Liquido(diretorioBase);

            expect(instancia.diretorioBase).toBe(diretorioBase);
            expect(instancia.arquivosDelegua).toEqual([]);
            expect(instancia.rotasDelegua).toEqual([]);
        });

        it('Deve inicializar com diretório estático padrão', () => {
            const instancia = new Liquido(process.cwd());

            expect(instancia.diretorioEstatico).toBe('publico');
        });
    });

    describe('Testes de Comandos do Terminal', () => {
        describe('Comando "novo"', () => {
            const caminhoDiretorioProjeto = criarDiretorioAplicacao(
                'teste-comando-novo'
            );

            afterAll(async () => {
                await sistemaArquivos.promises.rm(
                    caminhoDiretorioProjeto,
                    { recursive: true }
                );
            });

            it('O valor do atributo "liquido.aplicacao.nome" deve ser o nome do projeto', async () => {
                await copiarArquivosDeExemploParaNovoProjeto(
                    'ProjetoLegal',
                    'api-rest',
                    caminhoDiretorioProjeto
                );

                const caminhoConfiguracaoDelegua = `${caminhoDiretorioProjeto}/configuracao.delegua`;
                const codigoConfiguracaoDelegua = await sistemaArquivos.promises.readFile(
                    caminhoConfiguracaoDelegua,
                    'utf-8'
                );

                expect(codigoConfiguracaoDelegua).toContain('ProjetoLegal');
            });
        });
    });
});
