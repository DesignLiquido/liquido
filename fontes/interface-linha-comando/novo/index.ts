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
    linguagemDeBackEnd: string,
    diretorioProjeto: string
) {
    const diretorioExemplos = caminho.join(
        __dirname, `../exemplos/${linguagemDeBackEnd}/` + tipoDeProjeto
    );
    const formatoGlob =
        (diretorioExemplos + '/**/*.{delegua,pitu,delprops,foles,lmht,md}')
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

            if (novoCaminhoArquivo.endsWith('configuracao.delprops')) {
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
        execSync('git config --global --add safe.directory ' + diretorioProjeto);

        const conteudoGitIgnore = 'node_modules/\ndist/\nbuild/\n.env\n.env.local\n.env.development\n.env.production\ncoverage/\n*.log\nnpm-debug.log*\nyarn-debug.log*\nyarn-error.log*\n.DS_Store\nThumbs.db';
        await sistemaArquivos.promises.writeFile(
            `${diretorioProjeto}/.gitignore`,
            conteudoGitIgnore
        );


        execSync('git config user.email "liquido@designliquido.com.br"', { cwd: diretorioProjeto });
        execSync('git config user.name "Liquido"', { cwd: diretorioProjeto });
        execSync('git add .', { cwd: diretorioProjeto });
        execSync('git commit -m "Versionamento Inicial"', { cwd: diretorioProjeto });
        execSync('git config --unset user.email', { cwd: diretorioProjeto });
        execSync('git config --unset user.name', { cwd: diretorioProjeto });
    }
}

export async function detectarGerenciadorDePacotes(
    gerenciadorDePacotes: string,
    diretorioProjeto: string
) {
    const caminhoPackageJson = caminho.join(diretorioProjeto, 'package.json');

    switch (gerenciadorDePacotes) {
        case 'npm': {
            execSync('npm init -y', { cwd: diretorioProjeto });
            execSync('npm install liquido@latest', { cwd: diretorioProjeto });
            break;
        }
        case 'yarn': {
            execSync('yarn init -y', { cwd: diretorioProjeto });
            execSync('yarn add liquido@latest', { cwd: diretorioProjeto });
            break;
        }
        case 'bun': {
            if (!sistemaArquivos.existsSync(caminhoPackageJson)) {
                const conteudoPackageJson = {
                    name: caminho.basename(diretorioProjeto),
                    version: '1.0.0',
                    private: true,
                    dependencies: {}
                };

                await sistemaArquivos.promises.writeFile(
                    caminhoPackageJson,
                    JSON.stringify(conteudoPackageJson, null, 2) + '\n'
                );
            }

            execSync('bun add liquido@latest', { cwd: diretorioProjeto });
            break;
        }
    }
    await adicionarScriptsLiquido(caminhoPackageJson);
}

async function adicionarScriptsLiquido(caminhoPackageJson: string) {
    const packageJson = JSON.parse(
        await sistemaArquivos.promises.readFile(caminhoPackageJson, 'utf8')
    );

    packageJson.scripts ??= {};
    packageJson.scripts.liquido = 'node ./node_modules/liquido/index.js';

    await sistemaArquivos.promises.writeFile(
        caminhoPackageJson,
        JSON.stringify(packageJson, null, 2) + '\n'
    );
}

/* export function gerarProjetoPorTipoDeProjeto(tipoDeProjeto: string) {
    switch (tipoDeProjeto) {
        case 'api-rest':
            sistemaArquivos.
    }
} */
