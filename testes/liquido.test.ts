import * as caminho from 'path';
import sistemaArquivos from 'fs';
import * as ChildProcess from 'child_process';

import { Liquido } from '../fontes/liquido';
import { RetornoConfiguracaoInterface } from '../fontes/interfaces';
import {
    criarDiretorioAplicacao,
    copiarArquivosDeExemploParaNovoProjeto,
    gerarRepositorioGit,
    detectarGerenciadorDePacotes
} from '../fontes/interface-linha-comando';

jest.mock('child_process', () => {
    const original = jest.requireActual('child_process');
    return {
        ...original,
        execSync: jest.fn()
    };
});

describe('Liquido', () => {
    let liquido: Liquido;

    beforeEach(() => {
        liquido = new Liquido(process.cwd());
    });

    it('Testando descobrirRotas()', () => {
        liquido.descobrirRotas(
            caminho.join(__dirname, 'exemplos/rotas'),
            'delegua'
        );
        const rota1 = liquido.arquivosDelegua[0].split('rotas')[1];
        const rota2 = liquido.arquivosDelegua[1].split('rotas')[1];
        expect(liquido.arquivosDelegua.length).toBeGreaterThanOrEqual(2);
        expect(rota1).toBe(`${caminho.sep}inicial.delegua`);
        expect(rota2).toBe(`${caminho.sep}middlewares.delegua`);
    });

    it('Testando resolverCaminhoRota()', () => {
        const expected: string[] = [];

        liquido.descobrirRotas(
            caminho.join(__dirname, 'exemplos', 'rotas'),
            'delegua'
        );

        liquido.arquivosDelegua.forEach((arquivo) => {
            expected.push(liquido.resolverCaminhoRota(arquivo, 'delegua'));
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
        expect(retorno.caminho).toBe(caminho.join(__dirname, 'exemplos', 'configuracao.delprops'));
    });

    describe('Suporte a Pituguês', () => {
        it('Deve registrar a rota "/" a partir de um decorador no Pituguês', async () => {
            const instanciaTeste = new Liquido(
                caminho.join(__dirname, 'exemplos')
            );

            (instanciaTeste as any).centroConfiguracoes = {
                liquido: { linguagem: 'pitugues', arquetipo: 'rest' }
            };

            jest.spyOn(
                instanciaTeste,
                'importarArquivoConfiguracao'
            ).mockImplementation(async () => { });
            jest.spyOn(
                instanciaTeste.roteador,
                'iniciar'
            ).mockImplementation(() => { });

            await instanciaTeste.iniciar();

            expect(instanciaTeste.arquivosPitugues.length).toBeGreaterThan(0);
            expect(instanciaTeste.rotasPitugues).toContain('');

            jest.restoreAllMocks();
        });

        it('Deve analisar e carregar o arquivo inicial.pitu sem erros de sintaxe', async () => {
            liquido = new Liquido(caminho.join(__dirname, 'exemplos'));

            (liquido as any).centroConfiguracoes = {
                liquido: { linguagem: 'pitugues' }
            };

            jest.spyOn(
                liquido,
                'importarArquivoConfiguracao'
            ).mockImplementation(async () => { });

            jest.spyOn(
                liquido.roteador,
                'iniciar'
            ).mockImplementation(() => { });

            await expect(liquido.iniciar()).resolves.not.toThrow();

            expect(liquido.arquivosPitugues.length).toBeGreaterThan(0);

            const arquivoProcessado = liquido.arquivosPitugues.some(
                arquivo => arquivo.includes('inicial.pitu')
            );
            expect(arquivoProcessado).toBe(true);
        });

        it('Deve descobrir arquivos .pitu recursivamente quando a linguagem for pitugues', () => {
            liquido.descobrirRotas(
                caminho.join(__dirname, 'exemplos', 'rotas'),
                'pitugues'
            );

            expect(liquido.arquivosPitugues.length).toBeGreaterThan(0);

            liquido.arquivosPitugues.forEach(arquivo => {
                expect(arquivo.endsWith('.pitu')).toBe(true);
            });

            expect(liquido.arquivosDelegua.length).toBe(0);
        });

        it('Deve resolver caminho de arquivo inicial.pitu para rota raiz', () => {
            const arquivo = caminho.join(
                __dirname,
                'exemplos',
                'rotas',
                'inicial.pitu'
            );
            const rota = liquido.resolverCaminhoRota(arquivo, 'pitugues');

            expect(rota).toBe('');
        });

        it('Deve remover extensão .pitu do caminho', () => {
            const arquivo = caminho.join(
                __dirname,
                'exemplos',
                'rotas',
                'teste.pitu'
            );
            const rota = liquido.resolverCaminhoRota(arquivo, 'pitugues');

            expect(rota).not.toContain('.pitu');

            expect(rota.replace(/\\/g, '/')).toBe('/teste');
        });
    });

    describe('Testes de Middlewares', () => {
        beforeEach(() => {
            liquido = new Liquido(process.cwd());
        });

        it('Deve importar arquivo de rotas com middlewares sem erros', async () => {
            // Testa que o arquivo com middlewares é importado corretamente
            liquido.descobrirRotas(
                caminho.join(__dirname, 'exemplos', 'rotas'),
                'delegua'
            );

            // Verifica que o arquivo middlewares.delegua foi descoberto
            const arquivoMiddlewares = liquido.arquivosDelegua.find(
                arquivo => arquivo.includes('middlewares.delegua')
            );

            expect(arquivoMiddlewares).toBeDefined();
        });

        it('Deve processar rotas com diferentes quantidades de middlewares', async () => {
            // Este teste verifica que as rotas são registradas corretamente
            // Pode ser expandido para verificar o comportamento específico
            liquido.descobrirRotas(
                caminho.join(__dirname, 'exemplos', 'rotas'),
                'delegua'
            );

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
            const caminhoResolvido = liquido.resolverCaminhoRota(
                caminhoTeste,
                'delegua'
            );

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

            describe('O valor do atributo "liquido.aplicacao.nome" deve ser o nome do projeto', () => {
                it('API-REST', async () => {
                    await copiarArquivosDeExemploParaNovoProjeto(
                        'ProjetoLegal',
                        'api-rest',
                        'delegua',
                        caminhoDiretorioProjeto
                    );

                    const caminhoConfiguracaoDelegua = `${caminhoDiretorioProjeto}/configuracao.delprops`;
                    const codigoConfiguracaoDelegua = await sistemaArquivos.promises.readFile(
                        caminhoConfiguracaoDelegua,
                        'utf-8'
                    );

                    expect(codigoConfiguracaoDelegua).toContain('ProjetoLegal');
                });

                it('MVC', async () => {
                    await copiarArquivosDeExemploParaNovoProjeto(
                        'ProjetoLegal',
                        'mvc',
                        'delegua',
                        caminhoDiretorioProjeto
                    );

                    const caminhoConfiguracaoDelegua = `${caminhoDiretorioProjeto}/configuracao.delprops`;
                    const codigoConfiguracaoDelegua = await sistemaArquivos.promises.readFile(
                        caminhoConfiguracaoDelegua,
                        'utf-8'
                    );

                    expect(codigoConfiguracaoDelegua).toContain('ProjetoLegal');
                });
            });

            it('O repositório Git deve ser inicializado', async () => {
                (ChildProcess.execSync as jest.Mock).mockImplementation(
                    jest.requireActual('child_process').execSync
                );

                await copiarArquivosDeExemploParaNovoProjeto(
                    'ProjetoLegal',
                    'api-rest',
                    'delegua',
                    caminhoDiretorioProjeto
                );

                await gerarRepositorioGit(true, caminhoDiretorioProjeto);

                const arquivos = await sistemaArquivos.promises.readdir(
                    caminhoDiretorioProjeto
                );
                const conteudoGitIgnore = await sistemaArquivos
                    .promises
                    .readFile(`${caminhoDiretorioProjeto}/.gitignore`, 'utf-8');
                const conteudoGitLog = ChildProcess.execSync(
                    'git log',
                    { cwd: caminhoDiretorioProjeto, encoding: 'utf-8' }
                );

                expect(arquivos).toContain('.gitignore');
                expect(conteudoGitIgnore).toContain('node_modules/\ndist/\nbuild/\n.env\n.env.local\n.env.development\n.env.production\ncoverage/\n*.log\nnpm-debug.log*\nyarn-debug.log*\nyarn-error.log*\n.DS_Store\nThumbs.db');
                expect(conteudoGitLog).toContain('Versionamento Inicial');
            });

            it('Deve executar os comandos do npm para inicializar o projeto', async () => {
                jest.clearAllMocks();

                (ChildProcess.execSync as jest.Mock).mockImplementation(
                    () => Buffer.from('')
                );

                await detectarGerenciadorDePacotes(
                    'npm',
                    caminhoDiretorioProjeto
                );

                expect(ChildProcess.execSync).toHaveBeenCalledWith(
                    'npm init -y',
                    { cwd: caminhoDiretorioProjeto }
                );
                expect(ChildProcess.execSync).toHaveBeenCalledWith(
                    'npm install liquido@latest',
                    { cwd: caminhoDiretorioProjeto }
                );
            });


            it('Deve executar os comandos do yarn para inicializar o projeto', async () => {
                jest.clearAllMocks();

                (ChildProcess.execSync as jest.Mock).mockImplementation(
                    () => Buffer.from('')
                );

                await detectarGerenciadorDePacotes(
                    'yarn',
                    caminhoDiretorioProjeto
                );

                expect(ChildProcess.execSync).toHaveBeenCalledWith(
                    'yarn init -y',
                    { cwd: caminhoDiretorioProjeto }
                );
                expect(ChildProcess.execSync).toHaveBeenCalledWith(
                    'yarn add liquido@latest',
                    { cwd: caminhoDiretorioProjeto }
                );
    
            });
        

            it('Deve usar o nome da pasta quando o nome do projeto é criado com "." ou "./"', async () => {

                const spyCwd = jest
                    .spyOn(process, 'cwd')
                    .mockReturnValue('/home/usuario/minha-pasta-teste');

                let nomeProjetoTerminal = '.';
                let nomeProjetoResolvido = nomeProjetoTerminal;

                if (
                    nomeProjetoTerminal === '.' ||
                    nomeProjetoTerminal === './'
                ) nomeProjetoResolvido = caminho.basename(process.cwd());

                await copiarArquivosDeExemploParaNovoProjeto(
                    nomeProjetoResolvido,
                    'api-rest',
                    'delegua',
                    caminhoDiretorioProjeto
                );

                const caminhoConfiguracaoDelegua =
                    `${caminhoDiretorioProjeto}/configuracao.delprops`;

                const codigoConfiguracaoDelegua = await sistemaArquivos
                    .promises
                    .readFile(
                        caminhoConfiguracaoDelegua,
                        'utf-8'
                    );

                expect(codigoConfiguracaoDelegua).toContain('minha-pasta-teste');
                expect(codigoConfiguracaoDelegua).not.toContain("'.'");

                spyCwd.mockRestore();
           });
        });
    });

    describe('Processamento de Respostas', () => {
        it('Deve limpar objetos Delégua e retornar JSON puro', async () => {
            const objetoSimulado = {
                propriedades: {
                    id: 1,
                    titulo: "Teste",
                    descricao: "Descricao"
                },
                endereco: 'aaa-bbb-ccc-111-222-333'
            };

            const resultadoLimpo = (liquido as any)
                .limparObjeto(objetoSimulado);

            expect(resultadoLimpo).toHaveProperty('id', 1);
            expect(resultadoLimpo).toHaveProperty('titulo', 'Teste');
            expect(resultadoLimpo).not.toHaveProperty('endereco');
            expect(typeof resultadoLimpo).toBe('object');
        });

        it('Deve processar arrays de objetos corretamente', () => {
            const arraySimulado = [
                {
                    propriedades: { id: 1 },
                    endereco: 'abc-123'
                }
            ];

            const resultadoLimpo = (liquido as any).limparObjeto(arraySimulado);

            expect(Array.isArray(resultadoLimpo)).toBe(true);
            expect(resultadoLimpo[0]).toEqual({ id: 1 });
            expect(resultadoLimpo[0]).not.toHaveProperty('endereco');
        });

        it('[MVC] Deve retornar tela de erro', () => {
            (liquido as any).centroConfiguracoes = {
                liquido: { arquetipo: 'mvc' }
            }

            const erroFalso = {
                erros: [
                    {
                        linha: 1,
                        mensagem: "Aconteceu um erro..."
                    }
                ]
            };

            const resultado = (liquido as any).logicaComumErrosInterpretacao(
                erroFalso
            );

            expect(resultado.statusHttp).toBe(500);
            expect(resultado.corpoRetorno).toContain(
                'Erro de Execução - Líquido'
            );
        });
    });
});
