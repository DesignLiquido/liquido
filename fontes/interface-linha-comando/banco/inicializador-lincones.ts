import * as sistemaArquivos from 'fs';
import * as caminho from 'path';

import { green, red, yellow } from 'chalk';
import { TecnologiaLinconesInterface } from '@designliquido/lincones-sqlite/comum/fontes';

type ConstrutorTecnologiaLincones = new () => TecnologiaLinconesInterface;

const PRIMEIROS_TOKENS_DDL = new Set(['criar', 'alterar', 'remover']);
const PRIMEIROS_TOKENS_DML = new Set(['selecionar', 'inserir', 'atualizar', 'excluir']);

function classificarEnunciado(enunciado: string): 'ddl' | 'dml' | 'desconhecido' {
    const primeiraToken = enunciado.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
    if (PRIMEIROS_TOKENS_DDL.has(primeiraToken)) return 'ddl';
    if (PRIMEIROS_TOKENS_DML.has(primeiraToken)) return 'dml';
    return 'desconhecido';
}

export async function inicializarBancoLincones(
    tecnologia: string,
    caminhoBanco: string,
    arquivoScript: string,
    apenasEstrutura: boolean,
    apenasDados: boolean,
    instanciaExistente?: TecnologiaLinconesInterface
): Promise<void> {
    const caminhoScript = caminho.resolve(process.cwd(), arquivoScript);

    if (!sistemaArquivos.existsSync(caminhoScript)) {
        throw new Error(`Arquivo de inicialização não encontrado: ${caminhoScript}`);
    }

    const conteudo = sistemaArquivos.readFileSync(caminhoScript, 'utf-8');
    const enunciados = conteudo
        .split(';')
        .map(e => e.trim())
        .filter(e => e.length > 0);

    const enunciadosFiltrados = enunciados.filter(enunciado => {
        if (!apenasEstrutura && !apenasDados) return true;
        const classe = classificarEnunciado(enunciado);
        if (apenasEstrutura) return classe === 'ddl';
        if (apenasDados) return classe === 'dml';
        return true;
    });

    const ignorados = enunciados.length - enunciadosFiltrados.length;
    if (ignorados > 0) {
        console.info(yellow(`${ignorados} enunciado(s) ignorado(s) pelo filtro ativo.`));
    }

    let lincones: TecnologiaLinconesInterface;
    if (instanciaExistente) {
        lincones = instanciaExistente;
    } else {
        const moduloTecnologia = await import(`@designliquido/lincones-${tecnologia}`);
        const ConstrutorTecnologia = moduloTecnologia.default as ConstrutorTecnologiaLincones;
        lincones = new ConstrutorTecnologia();
        await lincones.iniciar(caminhoBanco);
    }

    let sucessos = 0;
    let falhas = 0;

    for (const enunciado of enunciadosFiltrados) {
        const resumo = enunciado.length > 60
            ? enunciado.substring(0, 60) + '...'
            : enunciado;
        try {
            await lincones.executar(null, enunciado, []);
            console.info(green(`  ✓ ${resumo}`));
            sucessos++;
        } catch (erro: any) {
            console.error(red(`  ✗ ${resumo}`));
            console.error(red(`    ${erro?.message ?? erro}`));
            falhas++;
        }
    }

    console.info(yellow(`\nTotal: ${enunciadosFiltrados.length} enunciado(s) — ${sucessos} executado(s), ${falhas} falha(s).`));
}
