import { InterpretadorComImportacao } from "@designliquido/delegua-node/interpretador";
// import { DeleguaFuncao, ObjetoDeleguaClasse, ObjetoPadrao, ReferenciaMontao } from "@designliquido/delegua/interpretador/estruturas";

/* import primitivasDicionario from '@designliquido/delegua/bibliotecas/primitivas-dicionario';
import primitivasNumero from '@designliquido/delegua/bibliotecas/primitivas-numero';
import primitivasTexto from '@designliquido/delegua/bibliotecas/primitivas-texto';
import primitivasVetor from '@designliquido/delegua/bibliotecas/primitivas-vetor'; */

// import tipoDeDadosPrimitivos from '@designliquido/delegua/tipos-de-dados/primitivos';
// import tipoDeDadosDelegua from "@designliquido/delegua/tipos-de-dados/delegua";

// import { RetornoQuebra } from "@designliquido/delegua/quebras";
import { AcessoIndiceVariavel, AcessoMetodoOuPropriedade, Chamada, Constante, Construto, Dicionario, Isto, Literal, Super, Variavel, Vetor } from "@designliquido/delegua/construtos";
import { TextoDocumentacao } from "@designliquido/delegua/declaracoes/texto-documentacao";
import { ErroEmTempoDeExecucao } from "@designliquido/delegua/excecoes";

/**
 * A única função deste interpretador é resolver bugs que precisam ser repassados
 * para o núcleo de Delégua.
 */
export class InterpretadorLiquido extends InterpretadorComImportacao {
    visitarDeclaracaoTextoDocumentacao(declaracao: TextoDocumentacao): Promise<any> | void {
        return Promise.resolve();
    }

    protected resolverNomeObjectoAcessado(objetoAcessado: Construto): string {
        switch (objetoAcessado.constructor) {
            // TODO: Não habilitar isso até que vetores sejam repassados para o montão.
            /* case AcessoMetodoOuPropriedade:
                return (objetoAcessado as AcessoMetodoOuPropriedade).simbolo.lexema;
            case AcessoIndiceVariavel:
                return this.resolverNomeObjectoAcessado((objetoAcessado as AcessoIndiceVariavel).entidadeChamada); */
            case Chamada:
                return this.resolverNomeObjectoAcessado((objetoAcessado as Chamada).entidadeChamada);
            case Constante:
                return (objetoAcessado as Constante).simbolo.lexema;
            case AcessoMetodoOuPropriedade:
            case AcessoIndiceVariavel:
            case Dicionario:
            case Literal:
            case Vetor:
                return '';
            case Isto:
                return (objetoAcessado as any).simboloChave.lexema;
            case Super:
                return (objetoAcessado as Super).simboloChave.lexema;
            case Variavel:
                return (objetoAcessado as Variavel).simbolo.lexema;
        }
        
        throw new ErroEmTempoDeExecucao((objetoAcessado as any).simbolo, `Construto ${objetoAcessado.constructor.name} não possui resolução de nome apropriada.`);
    }
    
    // Quando for necessário, implementar `overrides` aqui que serão repassados
    // ao núcleo posteriormente.
    // override resolverValor(objeto: any, referencia: boolean = false) {
    //     if (objeto === null || objeto === undefined) {
    //         return objeto;
    //     }

    //     if (Array.isArray(objeto)) {
    //         // Caso interpretador precise da referência ao vetor original (por exemplo, visita a `AcessoMetodoOuPropriedade`).
    //         if (referencia) {
    //             return objeto;
    //         }

    //         const vetorResolvido: any[] = [];
    //         for (const elemento of objeto) {
    //             vetorResolvido.push(this.resolverValor(elemento));
    //         }

    //         return vetorResolvido;
    //     }

    //     if (objeto instanceof ReferenciaMontao) {
    //         return this.resolverReferenciaMontao(objeto);
    //     }

    //     if (objeto instanceof RetornoQuebra) {
    //         return this.resolverValor(objeto.valor);
    //     }

    //     if (objeto.hasOwnProperty) {
    //         if (objeto.hasOwnProperty('valorRetornado')) {
    //             return this.resolverValor(objeto.valorRetornado);
    //         }

    //         if (objeto.hasOwnProperty('valor')) {
    //             if (Array.isArray(objeto.valor)) {
    //                 return this.resolverValor(objeto.valor);
    //             }

    //             if (objeto.valor instanceof ReferenciaMontao) {
    //                 return this.resolverReferenciaMontao(objeto.valor);
    //             }

    //             return objeto.valor;
    //         }
    //     }

    //     return objeto;
    // }

    /**
     * Retira a interpolação de um texto.
     * @param {texto} texto O texto
     * @param {any[]} interpolacoes A lista de interpolações a serem resolvidas.
     * @returns O texto com o valor das variáveis.
     */
    // override retirarInterpolacao(
    //     texto: string,
    //     interpolacoes: { expressaoInterpolacao: string; valor: any }[]
    // ): string {
    //     let textoFinal = texto;

    //     for (const elemento of interpolacoes) {
    //         // TODO: Há alguma chance de `elemento` ser `undefined` aqui?
    //         let valor = elemento?.valor;
    //         if (valor.hasOwnProperty && valor.hasOwnProperty('valorRetornado')) {
    //             valor = valor.valorRetornado;
    //         }

    //         if (valor.tipo === tipoDeDadosDelegua.LOGICO) {
    //             textoFinal = textoFinal.replace(
    //                 '${' + elemento.expressaoInterpolacao + '}',
    //                 this.paraTexto(valor)
    //             );
    //         } else {
    //             valor = this.resolverValor(valor);
    //             textoFinal = textoFinal.replace(
    //                 '${' + elemento.expressaoInterpolacao + '}',
    //                 `${this.paraTexto(valor)}`
    //             );
    //         }
    //     }

    //     return textoFinal;
    // }

    // override paraTexto(objeto: any): string {
    //     if (objeto === null || objeto === undefined) return tipoDeDadosDelegua.NULO;
    //     if (typeof objeto === tipoDeDadosPrimitivos.BOOLEANO) {
    //         return objeto ? 'verdadeiro' : 'falso';
    //     }

    //     if (objeto.valor instanceof ObjetoPadrao) return objeto.valor.paraTexto();
    //     if (
    //         objeto instanceof ObjetoDeleguaClasse ||
    //         objeto instanceof DeleguaFuncao ||
    //         typeof objeto.paraTexto === 'function'
    //     )
    //         return objeto.paraTexto();

    //     if (objeto instanceof RetornoQuebra) {
    //         if (typeof objeto.valor === 'boolean') return objeto.valor ? 'verdadeiro' : 'falso';
    //     }

    //     if (objeto instanceof Date) {
    //         const formato = Intl.DateTimeFormat('pt', {
    //             dateStyle: 'full',
    //             timeStyle: 'full',
    //         });
    //         return formato.format(objeto);
    //     }

    //     if (Array.isArray(objeto)) {
    //         let retornoVetor: string = '[';
    //         for (let elemento of objeto) {
    //             if (typeof elemento === 'object') {
    //                 retornoVetor += `${JSON.stringify(elemento)}, `;
    //                 continue;
    //             }
    //             retornoVetor +=
    //                 typeof elemento === 'string'
    //                     ? `'${elemento}', `
    //                     : `${this.paraTexto(elemento)}, `;
    //         }

    //         if (retornoVetor.length > 1) {
    //             retornoVetor = retornoVetor.slice(0, -2);
    //         }
    //         retornoVetor += ']';

    //         return retornoVetor;
    //     }

    //     if (typeof objeto === tipoDeDadosPrimitivos.OBJETO) {
    //         const objetoEscrita = {};
    //         for (const propriedade in objeto) {
    //             let valor = objeto[propriedade];
    //             if (typeof valor === tipoDeDadosPrimitivos.BOOLEANO) {
    //                 valor = valor ? 'verdadeiro' : 'falso';
    //             }

    //             if (valor instanceof ReferenciaMontao) {
    //                 valor = this.resolverValor(valor);
    //             }

    //             objetoEscrita[propriedade] = valor;
    //         }

    //         return JSON.stringify(objetoEscrita);
    //     }

    //     switch (objeto.constructor.name) {
    //         case 'Object':
    //             if ('tipo' in objeto) {
    //                 switch (objeto.tipo) {
    //                     case 'dicionário':
    //                         return JSON.stringify(objeto.valor);
    //                     default:
    //                         return objeto.valor;
    //                 }
    //             }
    //     }       

    //     return objeto.toString();
    // }
}