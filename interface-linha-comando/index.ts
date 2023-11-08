import { async as glob } from 'fast-glob'
import sistemaArquivos from 'fs';
import caminho from 'path';

export function criarDiretorioAplicacao(nomeAplicacao: string): string {
    const diretorioCompleto = process.cwd() + caminho.sep + nomeAplicacao;
    if (!sistemaArquivos.existsSync(nomeAplicacao)) {
        sistemaArquivos.mkdirSync(nomeAplicacao);
        console.log(`Diretório criado: ${diretorioCompleto}`);
    } else {
        console.log(`Diretório já existe: ${diretorioCompleto}`);
    }

    return diretorioCompleto;
}

export async function copiarExemploParaProjeto(tipoDeProjeto: string, diretorioProjeto: string) {
    const diretorioExemplos = caminho.join(__dirname, '../exemplos/' + tipoDeProjeto);
    const formatoGlob = (diretorioExemplos + '/**/*.{delegua,foles,lmht,md}').replace(/\\/gi, '/');
    
    const arquivos = await glob([formatoGlob], {
        dot: true,
        absolute: false,
        stats: false,
    });

    return Promise.all(
        arquivos.map(async (arquivo) => {
            const arquivoResolvido = caminho.resolve(arquivo);
            const novoCaminhoArquivo = arquivoResolvido.replace(diretorioExemplos, diretorioProjeto);
            console.log(novoCaminhoArquivo);
            await sistemaArquivos.promises.mkdir(caminho.dirname(novoCaminhoArquivo), { recursive: true })
            return sistemaArquivos.promises.copyFile(arquivoResolvido, novoCaminhoArquivo);
        })
    );
}

/* export function gerarProjetoPorTipoDeProjeto(tipoDeProjeto: string) {
    switch (tipoDeProjeto) {
        case 'api-rest':
            sistemaArquivos.
    }
} */