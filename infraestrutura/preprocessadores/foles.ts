import { FolEs } from '@designliquido/foles';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';

export class PreprocessadorFolEs {
  leitorLmht: XMLParser;
  construtorLmht: XMLBuilder;
  foles: FolEs;

  constructor() {
    this.leitorLmht = new XMLParser({
      ignoreAttributes: false
    });
    this.construtorLmht = new XMLBuilder({
      ignoreAttributes: false
    });
    this.foles = new FolEs(false);
  }

  processar(conteudoLmht: string): string {
    const objetoVisao = this.leitorLmht.parse(conteudoLmht);

    const cabeca = objetoVisao.lmht?.cabeca || objetoVisao.lmht?.cabeça;
    if (cabeca) {
      // Procurar por estrutura de estilo.
      const estilo = cabeca.estilo;
      if (estilo) {
        const estiloConvertido = this.foles.converterTextoParaCss(estilo);
        cabeca.style = estiloConvertido;
        delete cabeca.estilo;
      }
    }

    const xmlContent = this.construtorLmht.build(objetoVisao);
    return xmlContent;
  }
}
