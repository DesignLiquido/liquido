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

export async function buscaVariavelAmbienteEmArquivo(nomeVariavel: string) {
    const textoArquivo = await lerTextoDeArquivo(path.join(process.cwd(), nomeVariavel));

}

// export const devolveVariavelAmbiente = (nomeVariavel: string): string => {
//     if (process.env[nomeVariavel] === undefined) {
//         if (buscaVariavelAmbienteEmArquivo() === undefined)
//             throw new Error(`Variável de ambiente ${nomeVariavel} não definida!`);
//     }

// }