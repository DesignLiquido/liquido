import { FolEs } from '@designliquido/foles';
import { parseStringPromise, Builder } from 'xml2js';


export class PreprocessadorFolEs {
    construtorLmht: Builder;
    foles: FolEs;

    constructor() {
        this.construtorLmht = new Builder();
        this.foles = new FolEs(false);
    }

    async processar(conteudoLmht: string): Promise<string> {
        let objetoVisao: any;
        let cabeca: any[];
        try {
            objetoVisao = await parseStringPromise(conteudoLmht /*, options */);
            if (!objetoVisao) return '';
            cabeca = objetoVisao.lmht?.cabeca || objetoVisao.lmht?.cabeça;
        } catch (erro: any) {
            // TODO: Tratar melhor este erro.
            return Promise.reject(`LMHT com problema de conteúdo: ${erro}`);
        }
        
        if (cabeca) {
            // Procurar por estruturas de estilo e convertê-las para `style`, preservando
            // demais filhos de `<cabeca>` (ex: `<titulo>`, vindo de um layout `base.lmht` mesclado).
            // Antes, a troca era feita empurrando um novo elemento `<cabeca>` no array e removendo
            // o original com `shift()` — o que descartava qualquer outro filho que não fosse `estilo`.
            for (const elemento of cabeca) {
                if (!elemento.hasOwnProperty('estilo') || elemento.estilo.length === 0) {
                    continue;
                }

                const estilosConvertidos: string[] = [];
                for (const estilo of elemento.estilo) {
                    try {
                        estilosConvertidos.push(this.foles.converterTextoParaCss(estilo));
                    } catch (erro: any) {
                        console.error(
                            `[Liquido] Erro ao processar estilo no LMHT: ${erro.message || erro}. ` +
                            `O estilo será ignorado, mas a página continuará sendo renderizada.`
                        );
                    }
                }

                delete elemento.estilo;
                if (estilosConvertidos.length > 0) {
                    elemento.style = estilosConvertidos;
                }
            }
        }

        const xmlContent = this.construtorLmht.buildObject(objetoVisao);
        return xmlContent;
    }
}
