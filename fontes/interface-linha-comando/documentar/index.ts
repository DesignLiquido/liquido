import * as sistemaArquivos from 'fs';
import caminho from 'path';
import { yellow } from 'chalk';

import { AutoDocumentador } from '../../infraestrutura/auto-documentacao/auto-documentador';

/**
 * Comando `liquido documentar`.
 *
 * Lê as rotas do projeto e gera um arquivo `openapi.json` na raiz do
 * projeto com a especificação OpenAPI correspondente.
 *
 * O comando sempre termina com um resultado explícito no console:
 * - O caminho do arquivo gerado e o número de rotas documentadas; ou
 * - O motivo de nenhum arquivo ter sido gerado (nenhuma rota encontrada
 *   no diretório esperado), além de avisos de análise, se houver.
 *
 * @param caminhoSaida Caminho do arquivo de saída. Quando não informado,
 *                     usa `openapi.json` na raiz do projeto (diretório atual).
 */
export async function documentar(caminhoSaida?: string): Promise<void> {
    const autoDocumentador = new AutoDocumentador();
    const documento = await autoDocumentador.documentar();

    for (const erro of autoDocumentador.erros) {
        console.log(yellow(`Aviso: ${erro.message}`));
    }

    const rotasDocumentadas = Object.keys(documento.paths || {});
    if (rotasDocumentadas.length === 0) {
        console.log(`Nenhum arquivo de rota (.delegua) foi encontrado em: ${autoDocumentador.diretorioRotas}`);
        console.log('Nenhum arquivo de documentação foi gerado.');
        return;
    }

    const caminhoArquivoSaida = caminhoSaida || caminho.join(process.cwd(), 'openapi.json');
    sistemaArquivos.writeFileSync(caminhoArquivoSaida, JSON.stringify(documento, undefined, 4) + '\n');

    console.log(
        `Documentação OpenAPI gerada com ${rotasDocumentadas.length} rota(s) em: ${caminhoArquivoSaida}`
    );
}
