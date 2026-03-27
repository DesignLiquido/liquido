import fs from 'fs';
import path from 'path';

import * as VariaveisAmbiente from '../../infraestrutura/utilidades/variaveis-ambiente';
const { buscarVariavelAmbienteEmArquivo, devolverVariavelAmbiente, lerTextoDeArquivo } = VariaveisAmbiente;

describe('lerTextoDeArquivo', () => {
    it('deve ler um arquivo de texto e retornar suas linhas', () => {
        const arquivo = path.resolve(__dirname, 'arquivo-teste.txt');
        fs.writeFileSync(arquivo, 'linha 1\nlinha 2\nlinha 3');

        const linhas = lerTextoDeArquivo(arquivo);

        expect(linhas).toEqual(['linha 1', 'linha 2', 'linha 3']);
        fs.unlinkSync(arquivo);
    });

    it('deve retornar um array vazio se o arquivo não existir', () => {
        const arquivo = path.resolve(__dirname, 'arquivo-nao-existe.txt');

        const linhas = lerTextoDeArquivo(arquivo);

        expect(linhas).toEqual([]);
    });
});

describe('buscaVariavelAmbienteEmArquivo', () => {
    it('deve retornar o valor da variável de ambiente se ela existir no arquivo', () => {
        const arquivoAmbiente = path.join(process.cwd(), '.ambiente');
        fs.writeFileSync(arquivoAmbiente, 'chaveSecreta=MinhaChave\noutraVariavel=OutroValor');
        try {
            const valor = buscarVariavelAmbienteEmArquivo('chaveSecreta');
            expect(valor).toBe('MinhaChave');
        } finally {
            fs.unlinkSync(arquivoAmbiente);
        }
    });

    it('deve retornar undefined se a variável de ambiente não existir no arquivo', () => {
        const valor = buscarVariavelAmbienteEmArquivo('chaveSecretaInexistente');
        expect(valor).toBeUndefined();
    });
});

describe('devolveVariavelAmbiente', () => {
    const ANTIGO_AMBIENTE = process.env;

    beforeAll(() => {
        jest.resetModules();
        process.env = { ...ANTIGO_AMBIENTE };
    });

    afterAll(() => {
        process.env = ANTIGO_AMBIENTE;
    });

    it('deve retornar o valor da variável de ambiente se ela existir', () => {
        process.env.chaveSecreta = 'MinhaChave';
        const valor = devolverVariavelAmbiente('chaveSecreta');
        expect(valor).toBe('MinhaChave')
    });
    it('deve retornar um erro se a variável de ambiente não existir', () => {
        expect(() => devolverVariavelAmbiente('chaveSecretaInexistente')).toThrow('Variável de ambiente chaveSecretaInexistente não encontrada');
    });

    it('deve retornar true se a variável de ambiente for true', () => {
        process.env.variavelTrue = 'verdadeiro';
        const valor = devolverVariavelAmbiente('variavelTrue');
        expect(valor).toBe(true)
    })

    it('deve retornar false se a variável de ambiente for false', () => {
        process.env.variavelFalse = 'falso';
        const valor = devolverVariavelAmbiente('variavelFalse');
        expect(valor).toBe(false)
    })
});
