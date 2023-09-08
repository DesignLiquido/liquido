import sistemaArquivos from 'fs';
import caminho from 'path';

export const lerTextoDeArquivo = (caminho: string) => {
    if (sistemaArquivos.existsSync(caminho)) {
        const linhas: string[] = sistemaArquivos.readFileSync(caminho, 'utf8').split('\n');
        return linhas;
    }
    return [];
};

export const buscarVariavelAmbienteEmArquivo = (nomeVariavel: string): string | undefined => {
    const linhas: string[] = lerTextoDeArquivo(caminho.join(process.cwd(), '.ambiente'));
    for (const linha of linhas) {
        if (linha.startsWith(`${nomeVariavel}=`)) {
            return linha.split('=')[1].trim();
        }
    }
    return undefined;
};

export const devolverVariavelAmbiente = (nomeVariavel: string): string | boolean => {
    const valor = process.env[nomeVariavel] || buscarVariavelAmbienteEmArquivo(nomeVariavel);
    if (!valor) throw new Error(`Variável de ambiente ${nomeVariavel} não encontrada`);
    if (valor === 'true' || valor === 'True') return true;
    if (valor === 'false' || valor === 'False') return false;
    return valor;
};
