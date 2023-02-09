import {
    lerTextoDeArquivo,
    buscaVariavelAmbienteEmArquivo,
    devolveVariavelAmbiente
} from '../../infraestrutura/utilidades/devolve-variavel-ambiente';
import fs from 'fs';
import path from 'path'

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
        const valor = buscaVariavelAmbienteEmArquivo('chaveSecreta');
        expect(valor).toBe('MinhaChave')
    });
    it('deve retornar undefined se a variável de ambiente não existir no arquivo', () => {
        const valor = buscaVariavelAmbienteEmArquivo('chaveSecretaInexistente');
        expect(valor).toBeUndefined();
    });
})

describe('devolveVariavelAmbiente', () => {
    it('deve retornar o valor da variável de ambiente se ela existir', () => {
        const valor = devolveVariavelAmbiente('chaveSecreta');
        expect(valor).toBe('MinhaChave')
    });
    it('deve retornar um erro se a variável de ambiente não existir', () => {
        expect(() => devolveVariavelAmbiente('chaveSecretaInexistente')).toThrowError('Variável de ambiente chaveSecretaInexistente não encontrada');
    });
});