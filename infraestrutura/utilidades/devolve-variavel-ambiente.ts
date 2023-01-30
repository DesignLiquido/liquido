import fs from 'node:fs';
import path from 'node:path'

export async function lerTextoDeArquivo(caminho: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readFile(caminho, 'utf-8', (err, data) => {
            if (err) reject(err);
            resolve(data);
        })
    })
}

export async function buscaVariavelAmbienteEmArquivo(nomeVariavel: string) {
    const textoArquivo = await lerTextoDeArquivo(path.join(process.cwd(), nomeVariavel));
    console.log(textoArquivo);
}

// export const devolveVariavelAmbiente = (nomeVariavel: string): string => {
//     if (process.env[nomeVariavel] === undefined) {
//         if (buscaVariavelAmbienteEmArquivo() === undefined)
//             throw new Error(`Variável de ambiente ${nomeVariavel} não definida!`);
//     }

// }