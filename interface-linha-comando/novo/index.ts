import { execSync } from 'child_process';
import { async as glob } from 'fast-glob';
import sistemaArquivos from 'fs';
import caminho from 'path';

export function criarDiretorioAplicacao(nomeAplicacao: string): string {
    const caminhoDiretorioProjeto = process.cwd() + caminho.sep + nomeAplicacao;

    const diretorioJaExiste = sistemaArquivos.existsSync(nomeAplicacao)
    if (!diretorioJaExiste) {
        sistemaArquivos.mkdirSync(nomeAplicacao);
        console.log(`Diretório criado: ${caminhoDiretorioProjeto}`);
    } else console.log(`Diretório já existe: ${caminhoDiretorioProjeto}`);

    return caminhoDiretorioProjeto;
}

export async function copiarArquivosDeExemploParaNovoProjeto(
    nomeProjeto: string,
    tipoDeProjeto: string,
    diretorioProjeto: string
) {
    const diretorioExemplos = caminho.join(
        __dirname, '../exemplos/' + tipoDeProjeto
    );
    const formatoGlob =
        (diretorioExemplos + '/**/*.{delegua,foles,lmht,md}')
        .replace(/\\/gi, '/');

    const caminhosArquivos = await glob([formatoGlob], {
        dot: true,
        absolute: false,
        stats: false,
    });

    return Promise.all(
        caminhosArquivos.map(async (caminhoArquivo) => {
            const caminhoArquivoResolvido = caminho.resolve(caminhoArquivo);

            const novoCaminhoArquivo = caminhoArquivoResolvido.replace(
                diretorioExemplos,
                diretorioProjeto
            );

            await sistemaArquivos.promises.mkdir(
                caminho.dirname(novoCaminhoArquivo),
                { recursive: true }
            )

            if (novoCaminhoArquivo.endsWith('configuracao.delegua')) {
                let codigoConfiguracaoDelegua = await sistemaArquivos.promises.readFile(
                    caminhoArquivoResolvido,
                    'utf-8'
                );

                codigoConfiguracaoDelegua = codigoConfiguracaoDelegua.replace(
                    "'Minha aplicação'",
                    `'${nomeProjeto}'`
                );

                return sistemaArquivos.promises.writeFile(
                    novoCaminhoArquivo,
                    codigoConfiguracaoDelegua
                );
            } else {
                return sistemaArquivos.promises.copyFile(
                    caminhoArquivoResolvido,
                    novoCaminhoArquivo
                );
            }
        })
    );
}

export async function gerarRepositorioGit(
    inicializarRepositorioGit: boolean,
    diretorioProjeto: string,
) {
    if (inicializarRepositorioGit) {
        execSync('git init', { cwd: diretorioProjeto });

        const conteudoGitIgnore = 'node_modules/\ndist/\nbuild/\n.env\n.env.local\n.env.development\n.env.production\ncoverage/\n*.log\nnpm-debug.log*\nyarn-debug.log*\nyarn-error.log*\n.DS_Store\nThumbs.db';
        await sistemaArquivos.promises.writeFile(
            `${diretorioProjeto}/.gitignore`,
            conteudoGitIgnore
        );

        execSync('git add .', { cwd: diretorioProjeto });
        execSync('git commit -m "Commit Inicial"', { cwd: diretorioProjeto });
    }
}

/* export function gerarProjetoPorTipoDeProjeto(tipoDeProjeto: string) {
    switch (tipoDeProjeto) {
        case 'api-rest':
            sistemaArquivos.
    }
} */