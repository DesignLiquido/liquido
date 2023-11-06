import fs from 'fs';
import path from 'path';
import {
    buscarVariavelAmbienteEmArquivo,
    devolverVariavelAmbiente,
    lerTextoDeArquivo
} from '../../infraestrutura/utilidades/variaveis-ambiente';

describe('lerTextoDeArquivo', () => {
    it('deve ler um arquivo de texto e retornar suas linhas', () => {
        const caminho = path.resolve(__dirname, 'arquivo-teste.txt');
        fs.writeFileSync(caminho, 'linha 1\nlinha 2\nlinha 3');

        const linhas = lerTextoDeArquivo(caminho);

        expect(linhas).toEqual(['linha 1', 'linha 2', 'linha 3']);
        fs.unlinkSync(caminho);
    });

    it('deve retornar um array vazio se o arquivo não existir', () => {
        const caminho = path.resolve(__dirname, 'arquivo-nao-existe.txt');

        const linhas = lerTextoDeArquivo(caminho);

        expect(linhas).toEqual([]);
    });
});

describe('buscaVariavelAmbienteEmArquivo', () => {
    it('deve retornar o valor da variável de ambiente se ela existir no arquivo', () => {
        const valor = buscarVariavelAmbienteEmArquivo('chaveSecreta');
        expect(valor).toBe('MinhaChave')
    });
    it('deve retornar undefined se a variável de ambiente não existir no arquivo', () => {
        const valor = buscarVariavelAmbienteEmArquivo('chaveSecretaInexistente');
        expect(valor).toBeUndefined();
    });
})

describe('devolveVariavelAmbiente', () => {
    it('deve retornar o valor da variável de ambiente se ela existir', () => {
        const valor = devolverVariavelAmbiente('chaveSecreta');
        expect(valor).toBe('MinhaChave')
    });
    it('deve retornar um erro se a variável de ambiente não existir', () => {
        expect(() => devolverVariavelAmbiente('chaveSecretaInexistente')).toThrowError('Variável de ambiente chaveSecretaInexistente não encontrada');
    });

    it('deve retornar true se a variável de ambiente for true', () => {
        const valor = devolverVariavelAmbiente('variavelTrue');
        expect(valor).toBe(true)
    })

    it('deve retornar false se a variável de ambiente for false', () => {
        const valor = devolverVariavelAmbiente('variavelFalse');
        expect(valor).toBe(false)
    })
});