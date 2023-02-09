import fs from 'fs';
import path from 'path';

export const lerTextoDeArquivo = (caminho: string) => {
    if (fs.existsSync(caminho)) {
        const linhas: string[] = fs.readFileSync(caminho, 'utf8').split('\n');
        return linhas;
    }
    return [];
};

export const buscaVariavelAmbienteEmArquivo = (nomeVariavel: string): string | undefined => {
    let linhas: string[] = lerTextoDeArquivo(path.join(process.cwd(), 'variavel-ambiente.env'));
    for (const linha of linhas) {
        if (linha.startsWith(`${nomeVariavel}=`)) {
            return linha.split('=')[1].trim();
        }
    }
    return undefined;
};

export const devolveVariavelAmbiente = (nomeVariavel: string): string | boolean => {
    const valor = process.env[nomeVariavel] || buscaVariavelAmbienteEmArquivo(nomeVariavel);
    if (!valor) throw new Error(`Variável de ambiente ${nomeVariavel} não encontrada`);
    if (valor === 'true' || valor === 'True') return true;
    if (valor === 'false' || valor === 'False') return false;
    return valor;
};

