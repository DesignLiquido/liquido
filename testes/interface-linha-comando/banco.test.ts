import * as sistemaArquivos from 'fs';

jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
    readdirSync: jest.fn()
}));

jest.mock('@designliquido/lincones-sqlite', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(function () {
        this.iniciar = jest.fn().mockResolvedValue(undefined);
        this.executar = jest.fn().mockResolvedValue([{ linhasAfetadas: 1 }]);
        this.executarComando = jest.fn().mockResolvedValue([]);
    })
}));

jest.mock('@designliquido/delegua-entidades', () => ({
    __esModule: true,
    ExecutorMigracoes: jest.fn().mockImplementation(function () {
        this.executar = jest.fn().mockResolvedValue(undefined);
        this.executarTodas = jest.fn().mockResolvedValue(undefined);
    }),
    Semeador: jest.fn().mockImplementation(function () {
        this.semear = jest.fn().mockResolvedValue(undefined);
    })
}), { virtual: true });

import { inicializarBancoLincones } from '../../fontes/interface-linha-comando/banco/inicializador-lincones';
import { inicializarBancoDeleguaEntidades } from '../../fontes/interface-linha-comando/banco/inicializador-delegua-entidades';

function obterConstrutorLincones(): jest.Mock {
    return require('@designliquido/lincones-sqlite').default as jest.Mock;
}

function obterUltimaInstanciaLincones(): any {
    const ctor = obterConstrutorLincones();
    return ctor.mock.instances[ctor.mock.instances.length - 1];
}

describe('Testes dos inicializadores de banco de dados', () => {
    let mockExit: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        mockExit = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
        jest.spyOn(console, 'info').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('inicializarBancoLincones', () => {
        it('deve lançar erro quando o arquivo de script não é encontrado', async () => {
            (sistemaArquivos.existsSync as jest.Mock).mockReturnValue(false);

            await expect(
                inicializarBancoLincones('sqlite', ':memory:', 'inicializacao.lincones', false, false)
            ).rejects.toThrow();

            expect(mockExit).not.toHaveBeenCalled();
        });

        it('deve executar todos os enunciados quando nenhum filtro está ativo', async () => {
            (sistemaArquivos.existsSync as jest.Mock).mockReturnValue(true);
            (sistemaArquivos.readFileSync as jest.Mock).mockReturnValue(
                'CRIAR TABELA usuarios (ID INTEIRO);INSERIR EM usuarios (NOME) VALORES ("Ana")'
            );

            await inicializarBancoLincones('sqlite', ':memory:', 'inicializacao.lincones', false, false);

            const instancia = obterUltimaInstanciaLincones();
            expect(instancia.executar).toHaveBeenCalledTimes(2);
        });

        it('deve inicializar a tecnologia com o caminho correto', async () => {
            (sistemaArquivos.existsSync as jest.Mock).mockReturnValue(true);
            (sistemaArquivos.readFileSync as jest.Mock).mockReturnValue('CRIAR TABELA t (ID INTEIRO)');

            await inicializarBancoLincones('sqlite', 'banco.db', 'inicializacao.lincones', false, false);

            const instancia = obterUltimaInstanciaLincones();
            expect(instancia.iniciar).toHaveBeenCalledWith('banco.db');
        });

        it('deve ignorar enunciados em branco resultantes do split por ponto-e-vírgula', async () => {
            (sistemaArquivos.existsSync as jest.Mock).mockReturnValue(true);
            (sistemaArquivos.readFileSync as jest.Mock).mockReturnValue(
                'CRIAR TABELA t (ID INTEIRO);  ;  \n  ;INSERIR EM t VALORES (1)'
            );

            await inicializarBancoLincones('sqlite', ':memory:', 'inicializacao.lincones', false, false);

            const instancia = obterUltimaInstanciaLincones();
            expect(instancia.executar).toHaveBeenCalledTimes(2);
        });

        it('deve executar apenas enunciados DDL com --apenas-estrutura', async () => {
            (sistemaArquivos.existsSync as jest.Mock).mockReturnValue(true);
            (sistemaArquivos.readFileSync as jest.Mock).mockReturnValue(
                'CRIAR TABELA usuarios (ID INTEIRO);INSERIR EM usuarios (NOME) VALORES ("Ana");ALTERAR TABELA usuarios ADICIONAR COLUNA EMAIL TEXTO'
            );

            await inicializarBancoLincones('sqlite', ':memory:', 'inicializacao.lincones', true, false);

            const instancia = obterUltimaInstanciaLincones();
            expect(instancia.executar).toHaveBeenCalledTimes(2);
            expect(instancia.executar).toHaveBeenCalledWith(null, 'CRIAR TABELA usuarios (ID INTEIRO)', []);
            expect(instancia.executar).toHaveBeenCalledWith(null, 'ALTERAR TABELA usuarios ADICIONAR COLUNA EMAIL TEXTO', []);
        });

        it('deve reconhecer "remover" como DDL em --apenas-estrutura', async () => {
            (sistemaArquivos.existsSync as jest.Mock).mockReturnValue(true);
            (sistemaArquivos.readFileSync as jest.Mock).mockReturnValue(
                'REMOVER TABELA usuarios;INSERIR EM log VALORES (1)'
            );

            await inicializarBancoLincones('sqlite', ':memory:', 'inicializacao.lincones', true, false);

            const instancia = obterUltimaInstanciaLincones();
            expect(instancia.executar).toHaveBeenCalledTimes(1);
            expect(instancia.executar).toHaveBeenCalledWith(null, 'REMOVER TABELA usuarios', []);
        });

        it('deve executar apenas enunciados DML com --apenas-dados', async () => {
            (sistemaArquivos.existsSync as jest.Mock).mockReturnValue(true);
            (sistemaArquivos.readFileSync as jest.Mock).mockReturnValue(
                'CRIAR TABELA usuarios (ID INTEIRO);INSERIR EM usuarios (NOME) VALORES ("Ana");ATUALIZAR usuarios DEFINIR NOME = "Bob"'
            );

            await inicializarBancoLincones('sqlite', ':memory:', 'inicializacao.lincones', false, true);

            const instancia = obterUltimaInstanciaLincones();
            expect(instancia.executar).toHaveBeenCalledTimes(2);
            expect(instancia.executar).toHaveBeenCalledWith(null, 'INSERIR EM usuarios (NOME) VALORES ("Ana")', []);
            expect(instancia.executar).toHaveBeenCalledWith(null, 'ATUALIZAR usuarios DEFINIR NOME = "Bob"', []);
        });

        it('deve reconhecer "excluir" como DML em --apenas-dados', async () => {
            (sistemaArquivos.existsSync as jest.Mock).mockReturnValue(true);
            (sistemaArquivos.readFileSync as jest.Mock).mockReturnValue(
                'CRIAR TABELA usuarios (ID INTEIRO);EXCLUIR EM usuarios ONDE ID = 1'
            );

            await inicializarBancoLincones('sqlite', ':memory:', 'inicializacao.lincones', false, true);

            const instancia = obterUltimaInstanciaLincones();
            expect(instancia.executar).toHaveBeenCalledTimes(1);
            expect(instancia.executar).toHaveBeenCalledWith(null, 'EXCLUIR EM usuarios ONDE ID = 1', []);
        });

        it('deve continuar executando após falha em um enunciado e registrar o erro', async () => {
            (sistemaArquivos.existsSync as jest.Mock).mockReturnValue(true);
            (sistemaArquivos.readFileSync as jest.Mock).mockReturnValue(
                'CRIAR TABELA usuarios (ID INTEIRO);CRIAR TABELA pedidos (ID INTEIRO)'
            );
            const instanciaMock = {
                iniciar: jest.fn().mockResolvedValue(undefined),
                executar: jest.fn()
                    .mockRejectedValueOnce(new Error('Tabela já existe'))
                    .mockResolvedValueOnce([{ linhasAfetadas: 1 }]),
                executarComando: jest.fn()
            };
            obterConstrutorLincones().mockImplementationOnce(() => instanciaMock);

            await inicializarBancoLincones('sqlite', ':memory:', 'inicializacao.lincones', false, false);

            expect(instanciaMock.executar).toHaveBeenCalledTimes(2);
            expect(console.error).toHaveBeenCalled();
            expect(mockExit).not.toHaveBeenCalled();
        });

        it('deve logar o número de ignorados quando filtro está ativo e há enunciados descartados', async () => {
            (sistemaArquivos.existsSync as jest.Mock).mockReturnValue(true);
            (sistemaArquivos.readFileSync as jest.Mock).mockReturnValue(
                'CRIAR TABELA t (ID INTEIRO);INSERIR EM t VALORES (1)'
            );

            await inicializarBancoLincones('sqlite', ':memory:', 'inicializacao.lincones', true, false);

            expect(console.info).toHaveBeenCalledWith(expect.stringContaining('ignorado'));
        });

        it('deve usar instanciaExistente sem criar nova instância', async () => {
            (sistemaArquivos.existsSync as jest.Mock).mockReturnValue(true);
            (sistemaArquivos.readFileSync as jest.Mock).mockReturnValue('CRIAR TABELA t (ID INTEIRO)');

            const instanciaExistente = {
                iniciar: jest.fn(),
                executar: jest.fn().mockResolvedValue([{ linhasAfetadas: 1 }]),
                executarComando: jest.fn()
            } as any;

            const construtorAntes = obterConstrutorLincones().mock.instances.length;

            await inicializarBancoLincones('sqlite', ':memory:', 'inicializacao.lincones', false, false, instanciaExistente);

            expect(obterConstrutorLincones().mock.instances.length).toBe(construtorAntes);
            expect(instanciaExistente.iniciar).not.toHaveBeenCalled();
            expect(instanciaExistente.executar).toHaveBeenCalledWith(null, 'CRIAR TABELA t (ID INTEIRO)', []);
        });
    });

    describe('inicializarBancoDeleguaEntidades', () => {
        it('deve avisar quando o diretório "migracoes/" não existe e pular migrações', async () => {
            (sistemaArquivos.existsSync as jest.Mock).mockImplementation((p: string) =>
                !String(p).includes('migracoes')
            );
            (sistemaArquivos.readdirSync as jest.Mock).mockReturnValue([]);

            await inicializarBancoDeleguaEntidades('sqlite', ':memory:', false, false);

            expect(console.info).toHaveBeenCalledWith(
                expect.stringContaining('"migracoes/"')
            );
        });

        it('deve avisar quando não há arquivos de migração no diretório', async () => {
            (sistemaArquivos.existsSync as jest.Mock).mockReturnValue(true);
            (sistemaArquivos.readdirSync as jest.Mock).mockReturnValue(['README.md', 'notas.txt']);

            await inicializarBancoDeleguaEntidades('sqlite', ':memory:', false, false);

            expect(console.info).toHaveBeenCalledWith(
                expect.stringContaining('Nenhum arquivo de migração')
            );
        });

        it('deve avisar quando o diretório "sementes/" não existe e pular sementes', async () => {
            (sistemaArquivos.existsSync as jest.Mock).mockImplementation((p: string) =>
                !String(p).includes('sementes')
            );
            (sistemaArquivos.readdirSync as jest.Mock).mockReturnValue([]);

            await inicializarBancoDeleguaEntidades('sqlite', ':memory:', false, false);

            expect(console.info).toHaveBeenCalledWith(
                expect.stringContaining('"sementes/"')
            );
        });

        it('deve pular verificação de migrações com --apenas-dados', async () => {
            (sistemaArquivos.existsSync as jest.Mock).mockReturnValue(false);

            await inicializarBancoDeleguaEntidades('sqlite', ':memory:', false, true);

            const verificacoes = (sistemaArquivos.existsSync as jest.Mock).mock.calls.map(
                (c: any[]) => String(c[0])
            );
            expect(verificacoes.some((c: string) => c.includes('migracoes'))).toBe(false);
        });

        it('deve pular verificação de sementes com --apenas-estrutura', async () => {
            (sistemaArquivos.existsSync as jest.Mock).mockReturnValue(false);

            await inicializarBancoDeleguaEntidades('sqlite', ':memory:', true, false);

            const verificacoes = (sistemaArquivos.existsSync as jest.Mock).mock.calls.map(
                (c: any[]) => String(c[0])
            );
            expect(verificacoes.some((c: string) => c.includes('sementes'))).toBe(false);
        });

        it('deve inicializar a tecnologia com o caminho correto', async () => {
            (sistemaArquivos.existsSync as jest.Mock).mockReturnValue(false);

            await inicializarBancoDeleguaEntidades('sqlite', 'banco.db', false, false);

            const instancia = obterUltimaInstanciaLincones();
            expect(instancia.iniciar).toHaveBeenCalledWith('banco.db');
        });

        it('deve usar instanciaExistente sem criar nova instância de lincones', async () => {
            (sistemaArquivos.existsSync as jest.Mock).mockReturnValue(false);

            const instanciaExistente = {
                iniciar: jest.fn(),
                executar: jest.fn(),
                executarComando: jest.fn()
            } as any;

            const construtorAntes = obterConstrutorLincones().mock.instances.length;

            await inicializarBancoDeleguaEntidades('sqlite', ':memory:', false, false, instanciaExistente);

            expect(obterConstrutorLincones().mock.instances.length).toBe(construtorAntes);
            expect(instanciaExistente.iniciar).not.toHaveBeenCalled();
        });
    });
});
