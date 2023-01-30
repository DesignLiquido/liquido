import fs from 'fs';
import path from 'path';

const lerTextoDeArquivo = async (caminho: string): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        fs.readFile(caminho, 'utf-8', (err, data) => {
            if (err) reject(err);
            else resolve(data.split('\n'));
        });
    });
};

const buscaVariavelAmbienteEmArquivo = async (nomeVariavel: string): Promise<string | undefined> => {
    const linhas = await lerTextoDeArquivo(path.join(process.cwd(), 'variavel-ambiente.env'));
    for (const linha of linhas) {
        if (linha.startsWith(`${nomeVariavel}=`)) {
            return linha.split('=')[1];
        }
    }
    return undefined;
};

export const devolveVariavelAmbiente = async (nomeVariavel: string): Promise<string> => {
    const valor = process.env[nomeVariavel] || await buscaVariavelAmbienteEmArquivo(nomeVariavel);
    if (!valor) throw new Error(`Variável de ambiente ${nomeVariavel} não encontrada`);
    return valor;
};
