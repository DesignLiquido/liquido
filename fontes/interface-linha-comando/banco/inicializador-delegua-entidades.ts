import * as fs from 'fs';
import * as path from 'path';
import { green, red, yellow } from 'chalk';
import { TecnologiaLinconesInterface } from '@designliquido/lincones-sqlite/fontes/comum/fontes';

type ConstrutorTecnologiaLincones = new () => TecnologiaLinconesInterface;

export async function inicializarBancoDeleguaEntidades(
    tecnologia: string,
    caminhoBanco: string,
    apenasEstrutura: boolean,
    apenasDados: boolean
): Promise<void> {
    let moduloDeleguaEntidades: any;
    try {
        const pacote = '@designliquido/delegua-entidades';
        moduloDeleguaEntidades = await import(pacote);
    } catch {
        console.error(red(
            'Pacote @designliquido/delegua-entidades não encontrado. ' +
            'Instale-o com: npm install @designliquido/delegua-entidades'
        ));
        process.exit(1);
        return;
    }

    const { ExecutorMigracoes, Semeador } = moduloDeleguaEntidades;

    const moduloTecnologia = await import(`@designliquido/lincones-${tecnologia}`);
    const ConstrutorTecnologia = moduloTecnologia.default as ConstrutorTecnologiaLincones;
    const lincones = new ConstrutorTecnologia();
    await lincones.iniciar(caminhoBanco);

    const deveExecutarMigracoes = !apenasDados;
    const deveExecutarSementes = !apenasEstrutura;

    if (deveExecutarMigracoes) {
        await executarMigracoes(ExecutorMigracoes, lincones);
    }

    if (deveExecutarSementes) {
        await executarSementes(Semeador, lincones);
    }
}

async function executarMigracoes(
    ExecutorMigracoes: any,
    lincones: TecnologiaLinconesInterface
): Promise<void> {
    const diretorioMigracoes = path.resolve(process.cwd(), 'migracoes');

    if (!fs.existsSync(diretorioMigracoes)) {
        console.info(yellow('Diretório "migracoes/" não encontrado. Nenhuma migração executada.'));
        return;
    }

    const arquivos = fs.readdirSync(diretorioMigracoes)
        .filter(f => f.endsWith('.js') || f.endsWith('.ts'))
        .sort();

    if (arquivos.length === 0) {
        console.info(yellow('Nenhum arquivo de migração encontrado em "migracoes/".'));
        return;
    }

    const executor = new ExecutorMigracoes(lincones);
    let sucessos = 0;
    let falhas = 0;

    for (const arquivo of arquivos) {
        const caminhoArquivo = path.join(diretorioMigracoes, arquivo);
        try {
            const modulo = await import(caminhoArquivo);
            const migracao = modulo.default ?? modulo;
            await executor.executar(migracao);
            console.info(green(`  ✓ ${arquivo}`));
            sucessos++;
        } catch (erro: any) {
            console.error(red(`  ✗ ${arquivo}: ${erro?.message ?? erro}`));
            falhas++;
        }
    }

    console.info(yellow(`Migrações: ${sucessos} executada(s), ${falhas} falha(s).`));
}

async function executarSementes(
    Semeador: any,
    lincones: TecnologiaLinconesInterface
): Promise<void> {
    const diretorioSementes = path.resolve(process.cwd(), 'sementes');

    if (!fs.existsSync(diretorioSementes)) {
        console.info(yellow('Diretório "sementes/" não encontrado. Nenhuma semente executada.'));
        return;
    }

    const arquivos = fs.readdirSync(diretorioSementes)
        .filter(f => f.endsWith('.js') || f.endsWith('.ts'))
        .sort();

    if (arquivos.length === 0) {
        console.info(yellow('Nenhum arquivo de semente encontrado em "sementes/".'));
        return;
    }

    const classes: any[] = [];
    for (const arquivo of arquivos) {
        const caminhoArquivo = path.join(diretorioSementes, arquivo);
        try {
            const modulo = await import(caminhoArquivo);
            classes.push(modulo.default ?? modulo);
        } catch (erro: any) {
            console.error(red(`  ✗ Erro ao importar semente ${arquivo}: ${erro?.message ?? erro}`));
        }
    }

    if (classes.length === 0) return;

    // Semeador expects a ContextoEntidades, but only accesses .tecnologia at runtime.
    const contexto = { tecnologia: lincones };
    const semeador = new Semeador(contexto);

    try {
        await semeador.semear(classes);
        console.info(green(`  ✓ ${classes.length} semente(s) executada(s).`));
    } catch (erro: any) {
        console.error(red(`Erro ao semear: ${erro?.message ?? erro}`));
    }
}
