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
            cabeca = objetoVisao.lmht?.cabeca || objetoVisao.lmht?.cabeça;
        } catch (erro: any) {
            // TODO: Tratar melhor este erro.
            return Promise.reject(`Conteúdo LMHT com problema de conteúdo: ${erro}`);
        }
        
        if (cabeca) {
            // Procurar por estruturas de estilo.
            const estilos = [];
            for (const elemento of cabeca) {
                if (elemento.hasOwnProperty('estilo') && elemento.estilo.length > 0) {
                    estilos.push(elemento.estilo[0]);
                    break;
                }
            }

            if (estilos.length > 0) {
                for (const estilo of estilos) {
                    const estiloConvertido = this.foles.converterTextoParaCss(estilo);
                    cabeca.push({ style: [estiloConvertido] });
                }
                
                // TODO: Melhorar essa lógica. Isso pode excluir outra coisa que não uma tag de estilo.
                cabeca.shift();
            }
        }

        const xmlContent = this.construtorLmht.buildObject(objetoVisao);
        return xmlContent;
    }
}
