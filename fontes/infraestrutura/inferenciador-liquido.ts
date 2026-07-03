import { TipoInferencia, TipoNativoSimbolo } from '@designliquido/delegua/inferenciador';
import { SimboloInterface } from '@designliquido/delegua/interfaces';

import tipoDeDadosPrimitivos from '@designliquido/delegua/tipos-de-dados/primitivos';
import tipoDeDadosDelegua from '@designliquido/delegua/tipos-de-dados/delegua';
import tiposDeSimbolos from '@designliquido/delegua/tipos-de-simbolos/delegua';

// TODO: Depreciar na versão 0.50.1 de Delégua.
export function inferirTipoVariavel(variavel: any): string {
    if (variavel === null || variavel === undefined) {
        return 'nulo';
    }

    const tipo = variavel.constructor ? variavel.constructor.name : typeof variavel;
    switch (tipo) {
        case 'String':
        case 'string':
            return 'texto';
        case 'Number':
        case 'number':
            return 'número';
        case 'bigint':
            return 'longo';
        case 'Boolean':
        case 'boolean':
            return 'lógico';
        case 'undefined':
            return 'nulo';
        case 'Object':
        case 'object':
            if (variavel === null) return 'nulo';
            return 'dicionário';
        case 'Array':
        case 'Vetor':
            return inferirVetor(variavel as Array<any>);
        case 'DeleguaFuncao':
            return 'função';
        case 'DeleguaModulo':
            return 'módulo';
        case 'Classe':
            return 'objeto';
        case 'Simbolo': // TODO: Repensar.
            const simbolo = variavel as SimboloInterface;
            switch (simbolo.tipo) {
                case tipoDeDadosPrimitivos.BOOLEANO:
                    return TipoNativoSimbolo.BOOLEANO;
                case tiposDeSimbolos.ENQUANTO:
                    return TipoNativoSimbolo.ENQUANTO;
                case tiposDeSimbolos.ESCREVA:
                    return TipoNativoSimbolo.ESCREVA;
                case tiposDeSimbolos.FUNCAO:
                case tiposDeSimbolos.FUNÇÃO:
                    return TipoNativoSimbolo.FUNCAO;
                case tiposDeSimbolos.LEIA:
                    return TipoNativoSimbolo.LEIA;
                case tiposDeSimbolos.PARA:
                    return TipoNativoSimbolo.PARA;
                case tiposDeSimbolos.RETORNA:
                    return TipoNativoSimbolo.RETORNA;
                case tiposDeSimbolos.SE:
                    return TipoNativoSimbolo.SE;
                case tipoDeDadosPrimitivos.TEXTO:
                    return TipoNativoSimbolo.TEXTO;
                case tipoDeDadosDelegua.VAZIO:
                    return TipoNativoSimbolo.VAZIO;
            }
        case 'function':
        case 'FuncaoPadrao':
            return 'função';
        case 'symbol':
            return 'símbolo';
    }
}

// TODO: Depreciar na versão 0.50.1 de Delégua.
function inferirVetor(vetor: Array<any>): TipoInferencia {
    const tiposEmVetor = new Set(vetor.map((elemento) =>
        elemento === null || elemento === undefined ? typeof elemento : elemento.constructor.name
    ));
    if (tiposEmVetor.size > 1) {
        return 'vetor';
    }

    const tipoVetor = tiposEmVetor.values().next().value;
    switch (tipoVetor) {
        case 'bigint':
            return 'longo[]';
        case 'boolean':
            return 'lógico[]';
        case 'number':
            return 'número[]';
        case 'string':
            return 'texto[]';
        case 'object':
            const tiposObjetosEmVetor = new Set(vetor.map((elemento) => (elemento as any).tipo));
            if (tiposObjetosEmVetor.size > 1) {
                return 'vetor';
            }

            return `${tiposObjetosEmVetor.values().next().value}[]` as TipoInferencia;
        case 'Literal':
            // TODO: Não sei se é seguro inferir pelo primeiro valor do vetor.
            return `${vetor[0].tipo}[]` as TipoInferencia;
        default:
            return 'vetor';
    }
}
