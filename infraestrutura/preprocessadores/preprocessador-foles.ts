import { FolEs } from '@designliquido/foles';
import { parseString, Builder } from 'xml2js';


export class PreprocessadorFolEs {
    construtorLmht: Builder;
    foles: FolEs;

    constructor() {
        this.construtorLmht = new Builder();
        this.foles = new FolEs(false);
    }

    processar(conteudoLmht: string): string {
        let objetoVisao;
        parseString(conteudoLmht, (_, resultado) => {
            objetoVisao = resultado;
        });

        const cabeca = objetoVisao.lmht?.cabeca || objetoVisao.lmht?.cabeça;
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
