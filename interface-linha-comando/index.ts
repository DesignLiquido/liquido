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

/* export function gerarProjetoPorTipoDeProjeto(tipoDeProjeto: string) {
    switch (tipoDeProjeto) {
        case 'api-rest':
            sistemaArquivos.
    }
} */