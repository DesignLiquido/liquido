import * as sistemaArquivos from 'fs';

import {
    obterTodosModelos,
    criarDiretorioSeNaoExiste,
    criarDiretorioComIdSeNaoExiste
} from '../../fontes/interface-linha-comando/gerar';

jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    readdirSync: jest.fn()
}));

describe('Testes das funções geradoras de interface de linha de comando', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('obterTodosModelos', () => {
        it('deve retornar modelos com extensão .delegua', () => {
            (sistemaArquivos.existsSync as jest.Mock).mockReturnValue(true);
            (sistemaArquivos.readdirSync as jest.Mock).mockReturnValue([
                'usuario.delegua',
                'produto.delegua',
                'README.md'
            ]);
            const modelos = obterTodosModelos();
            expect(modelos).toHaveLength(2);
            expect(modelos[0]).toEqual({ title: 'usuario', value: 'usuario' });
            expect(modelos[1]).toEqual({ title: 'produto', value: 'produto' });
        });

        it('deve retornar lista vazia quando não há arquivos .delegua', () => {
            (sistemaArquivos.existsSync as jest.Mock).mockReturnValue(true);
            (sistemaArquivos.readdirSync as jest.Mock).mockReturnValue([
                'README.md',
                'package.json'
            ]);
            const modelos = obterTodosModelos();
            expect(modelos).toHaveLength(0);
        });

        it('deve retornar lista vazia quando o diretório modelos não existe', () => {
            (sistemaArquivos.existsSync as jest.Mock).mockReturnValue(false);
            const modelos = obterTodosModelos();
            expect(modelos).toHaveLength(0);
            expect(sistemaArquivos.readdirSync).not.toHaveBeenCalled();
        });
    });

    describe('criarDiretorioSeNaoExiste', () => {
        it('deve criar o diretório quando não existe', () => {
            (sistemaArquivos.existsSync as jest.Mock).mockReturnValue(false);
            criarDiretorioSeNaoExiste('meu-diretorio');
            expect(sistemaArquivos.mkdirSync).toHaveBeenCalled();
        });

        it('não deve criar o diretório quando já existe', () => {
            (sistemaArquivos.existsSync as jest.Mock).mockReturnValue(true);
            criarDiretorioSeNaoExiste('meu-diretorio');
            expect(sistemaArquivos.mkdirSync).not.toHaveBeenCalled();
        });
    });

    describe('criarDiretorioComIdSeNaoExiste', () => {
        it('deve criar o diretório com [id] quando não existe', () => {
            (sistemaArquivos.existsSync as jest.Mock).mockReturnValue(false);
            const resultado = criarDiretorioComIdSeNaoExiste('rotas/usuarios');
            expect(sistemaArquivos.mkdirSync).toHaveBeenCalled();
            expect(resultado).toContain('[id]');
        });

        it('não deve criar o diretório com [id] quando já existe', () => {
            (sistemaArquivos.existsSync as jest.Mock).mockReturnValue(true);
            const resultado = criarDiretorioComIdSeNaoExiste('rotas/usuarios');
            expect(sistemaArquivos.mkdirSync).not.toHaveBeenCalled();
            expect(resultado).toContain('[id]');
        });
    });
});
