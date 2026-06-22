import * as sistemaArquivos from 'fs';

import { Classe } from '@designliquido/delegua/declaracoes';
import { Criar, Coluna, TradutorReversoSqlAnsi } from '@designliquido/lincones-js';
import { pluralizar } from '@designliquido/flexoes';

function mapearTipo(tipo?: string): 'CARACTERES' | 'INTEIRO' | 'LOGICO' | 'TEXTO' {
    switch ((tipo || '').toLowerCase()) {
        case 'inteiro':
        case 'numero':
            return 'INTEIRO';
        case 'logico':
        case 'lógico':
            return 'LOGICO';
        case 'caracteres':
            return 'CARACTERES';
        case 'texto':
        default:
            return 'TEXTO';
    }
}

function obterNomeChave(modelo: Classe): string {
    for (const propriedade of modelo.propriedades) {
        if (propriedade.decoradores.some((d) => d.nome === '@chave')) {
            return propriedade.nome.lexema;
        }
    }
    for (const propriedade of modelo.propriedades) {
        if (propriedade.nome.lexema === 'id') return 'id';
    }
    return 'id';
}

export class GeradorInicializacaoLincones {
    private tradutor = new TradutorReversoSqlAnsi();

    acrescentarCriarTabela(declaracaoModelo: Classe, caminhoArquivo: string): void {
        const nomeTabela = pluralizar(declaracaoModelo.simbolo.lexema.toLocaleLowerCase('pt'));
        const nomeChave = obterNomeChave(declaracaoModelo);

        const colunas = declaracaoModelo.propriedades.map((p) => {
            const ehChave = p.nome.lexema === nomeChave;
            return new Coluna(
                p.nome.lexema,
                mapearTipo(p.tipo),
                undefined,
                false,
                ehChave,
                false,
                ehChave
            );
        });

        const criar = new Criar(0, nomeTabela, colunas, true);
        const ddl = this.tradutor.traduzir([criar]).trim();
        const entrada = `${ddl};\n`;

        if (sistemaArquivos.existsSync(caminhoArquivo)) {
            const conteudo = sistemaArquivos.readFileSync(caminhoArquivo, 'utf-8');
            if (conteudo.includes(nomeTabela)) {
                return;
            }
            sistemaArquivos.appendFileSync(caminhoArquivo, `\n${entrada}`);
        } else {
            sistemaArquivos.writeFileSync(caminhoArquivo, entrada);
        }
    }
}
