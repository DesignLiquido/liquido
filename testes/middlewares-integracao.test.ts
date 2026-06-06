import * as caminho from 'path';

import { Liquido } from '../fontes/liquido';

describe('Testes de Integração - Middlewares', () => {
    let liquido: Liquido;

    beforeEach(() => {
        liquido = new Liquido(caminho.join(__dirname, 'exemplos'));

        (liquido as any).centroConfiguracoes = {
            liquido: { linguagem: 'delegua', arquetipo: 'rest' }
        };
    });

    describe('Importação e Parsing de Rotas com Middlewares', () => {
        it('Deve importar rotas com middlewares sem erros', async () => {
            // Testa a importação completa do arquivo de rotas com middlewares
            await expect(liquido.importarArquivosRotas()).resolves.not.toThrow();
        });

        it('Deve descobrir todas as rotas incluindo middlewares', () => {
            liquido.descobrirRotas(
                caminho.join(__dirname, 'exemplos', 'rotas'),
                'delegua'
            );

            // Verifica que descobriu múltiplos arquivos
            expect(liquido.arquivosDelegua.length).toBeGreaterThan(0);

            // Verifica que o arquivo de middlewares foi descoberto
            const arquivoMiddlewares = liquido.arquivosDelegua.find(
                arquivo => arquivo.includes('middlewares.delegua')
            );
            expect(arquivoMiddlewares).toBeDefined();
        });

        it('Deve resolver corretamente caminhos de rotas com middlewares', () => {
            const arquivoTeste = caminho.join(
                __dirname,
                'exemplos',
                'rotas',
                'middlewares.delegua'
            );
            const caminhoResolvido = liquido.resolverCaminhoRota(
                arquivoTeste,
                'delegua'
            );

            expect(caminhoResolvido).toBe('/middlewares');
        });
    });

    describe('Validação de Estrutura', () => {
        it('Deve ter roteador configurado', () => {
            expect(liquido.roteador).toBeDefined();
            expect(liquido.roteador.mapaRotas).toBeDefined();
        });

        it('Deve ter interpretador configurado', () => {
            expect(liquido.interpretador).toBeDefined();
        });

        it('Deve ter avaliador sintático configurado', () => {
            expect(liquido.avaliadorSintatico).toBeDefined();
        });

        it('Deve ter formatador LMHT configurado', () => {
            expect(liquido.formatadorLmht).toBeDefined();
        });
    });

    describe('Descoberta de Arquivos', () => {
        it('Deve inicializar arrays vazios antes da descoberta', () => {
            const novaInstancia = new Liquido(process.cwd());

            expect(novaInstancia.arquivosDelegua).toEqual([]);
            expect(novaInstancia.rotasDelegua).toEqual([]);
            expect(novaInstancia.diretorioDescobertos).toEqual([]);
        });

        it('Deve descobrir arquivos .delegua recursivamente', () => {
            liquido.descobrirRotas(
                caminho.join(__dirname, 'exemplos', 'rotas'),
                'delegua'
            );

            // Deve encontrar múltiplos arquivos
            expect(liquido.arquivosDelegua.length).toBeGreaterThanOrEqual(3);

            // Todos os arquivos descobertos devem ter extensão .delegua
            liquido.arquivosDelegua.forEach(arquivo => {
                expect(arquivo.endsWith('.delegua')).toBe(true);
            });
        });

        it('Deve descobrir arquivos em subdiretórios', () => {
            liquido.descobrirRotas(
                caminho.join(__dirname, 'exemplos', 'rotas'),
                'delegua'
            );

            // Deve incluir arquivos do subdiretório mvc
            const arquivoMvc = liquido.arquivosDelegua.find(
                arquivo => arquivo.includes('mvc')
            );
            expect(arquivoMvc).toBeDefined();
        });
    });

    describe('Resolução de Caminhos', () => {
        it('Deve resolver caminho de arquivo inicial.delegua para rota raiz', () => {
            const arquivo = caminho.join(__dirname, 'exemplos', 'rotas', 'inicial.delegua');
            const rota = liquido.resolverCaminhoRota(arquivo, 'delegua');

            expect(rota).toBe('/');
        });

        it('Deve resolver caminho de arquivo em subdiretório', () => {
            const arquivo = caminho.join(__dirname, 'exemplos', 'rotas', 'mvc', 'inicial.delegua');
            const rota = liquido.resolverCaminhoRota(arquivo, 'delegua');

            expect(rota).toBe('/mvc');
        });

        it('Deve remover extensão .delegua do caminho', () => {
            const arquivo = caminho.join(__dirname, 'exemplos', 'rotas', 'teste.delegua');
            const rota = liquido.resolverCaminhoRota(arquivo, 'delegua');

            expect(rota).not.toContain('.delegua');
        });

        it('Deve substituir separadores de caminho por barras', () => {
            const arquivo = caminho.join(__dirname, 'exemplos', 'rotas', 'sub', 'teste.delegua');
            const rota = liquido.resolverCaminhoRota(arquivo, 'delegua');

            // Deve usar barras, não backslashes
            expect(rota).toContain('/');
            if (caminho.sep === '\\') {
                expect(rota).not.toContain('\\');
            }
        });
    });

    describe('Configuração', () => {
        it('Deve resolver arquivo de configuração se existir', () => {
            const retorno = liquido.resolverArquivoConfiguracao(
                caminho.join(__dirname, 'exemplos')
            );

            expect(retorno.valor).toBe(true);
            expect(retorno.caminho).toContain('configuracao.delprops');
        });

        it('Deve retornar valor false se configuração não existir', () => {
            const retorno = liquido.resolverArquivoConfiguracao(
                caminho.join(__dirname, 'nao-existe')
            );

            expect(retorno.valor).toBe(false);
            expect(retorno.caminho).toBeNull();
        });
    });

    describe('Descoberta de Estilos', () => {
        it('Deve retornar array ao descobrir estilos', () => {
            const estilos = liquido.descobrirEstilos();

            expect(Array.isArray(estilos)).toBe(true);
        });

        it('Deve filtrar apenas arquivos .foles', () => {
            const estilos = liquido.descobrirEstilos();

            // Se houver estilos, todos devem ter extensão .foles
            estilos.forEach(estilo => {
                expect(estilo.endsWith('.foles')).toBe(true);
            });
        });
    });
});
