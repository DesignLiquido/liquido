import fs from 'node:fs';
import path from 'node:path'

export async function lerTextoDeArquivo(caminho: string): Promise<Array<String>> {
    return new Promise((resolve, reject) => {
        fs.readFile(caminho, 'utf-8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                const linhas = data.split('\n');
                resolve(linhas)
            }
        })
    })
}

export async function buscaVariavelAmbienteEmArquivo(nomeVariavel: string): Promise<string | undefined> {
    const textoArquivo = await lerTextoDeArquivo(path.join(process.cwd(), 'variavel-ambiente.env'));
    textoArquivo.forEach(linha => {
        if (linha.startsWith('chaveSecreta')) {
            return linha.split('=')[1];
        }
    })
    return undefined;
}

export async function devolveVariavelAmbiente(nomeVariavel: string): Promise<string> {
    if (!process.env[nomeVariavel]) {
        if (!buscaVariavelAmbienteEmArquivo(nomeVariavel)) {
            throw new Error(`Variável de ambiente ${nomeVariavel} não encontrada`)
        } else {
            return buscaVariavelAmbienteEmArquivo(nomeVariavel) as Promise<string>;
        }
    } else {
        return process.env[nomeVariavel] as string;
    }
}