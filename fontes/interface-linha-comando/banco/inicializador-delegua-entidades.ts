import * as sistemaArquivos from 'fs';
import * as caminho from 'path';
import { green, red, yellow } from 'chalk';

import { TecnologiaLinconesInterface } from '@designliquido/lincones-sqlite/comum/fontes';

type ConstrutorTecnologiaLincones = new () => TecnologiaLinconesInterface;

export async function inicializarBancoDeleguaEntidades(
    tecnologia: string,
    caminhoBanco: string,
    apenasEstrutura: boolean,
    apenasDados: boolean,
    instanciaExistente?: TecnologiaLinconesInterface
): Promise<void> {
    let moduloDeleguaEntidades: any;
    try {
        const pacote = '@designliquido/delegua-entidades';
        moduloDeleguaEntidades = await import(pacote);
    } catch {
        throw new Error(
            'Pacote @designliquido/delegua-entidades não encontrado. ' +
            'Instale-o com: npm install @designliquido/delegua-entidades'
        );
    }

    const { ExecutorMigracoes, Semeador } = moduloDeleguaEntidades;

    let lincones: TecnologiaLinconesInterface;
    if (instanciaExistente) {
        lincones = instanciaExistente;
    } else {
        const moduloTecnologia = await import(`@designliquido/lincones-${tecnologia}`);
        const ConstrutorTecnologia = moduloTecnologia.default as ConstrutorTecnologiaLincones;
        lincones = new ConstrutorTecnologia();
        await lincones.iniciar(caminhoBanco);
    }

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
    const diretorioMigracoes = caminho.resolve(process.cwd(), 'migracoes');

    if (!sistemaArquivos.existsSync(diretorioMigracoes)) {
        console.info(yellow('Diretório "migracoes/" não encontrado. Nenhuma migração executada.'));
        return;
    }

    const arquivos = sistemaArquivos.readdirSync(diretorioMigracoes)
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
        const caminhoArquivo = caminho.join(diretorioMigracoes, arquivo);
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
    const diretorioSementes = caminho.resolve(process.cwd(), 'sementes');

    if (!sistemaArquivos.existsSync(diretorioSementes)) {
        console.info(yellow('Diretório "sementes/" não encontrado. Nenhuma semente executada.'));
        return;
    }

    const arquivos = sistemaArquivos.readdirSync(diretorioSementes)
        .filter(f => f.endsWith('.js') || f.endsWith('.ts'))
        .sort();

    if (arquivos.length === 0) {
        console.info(yellow('Nenhum arquivo de semente encontrado em "sementes/".'));
        return;
    }

    const classes: any[] = [];
    for (const arquivo of arquivos) {
        const caminhoArquivo = caminho.join(diretorioSementes, arquivo);
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
