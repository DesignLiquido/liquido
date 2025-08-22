import { InterpretadorComImportacao } from "@designliquido/delegua-node/interpretador";
import { DeleguaModulo, MetodoPrimitiva, ObjetoDeleguaClasse, ReferenciaMontao } from "@designliquido/delegua/interpretador/estruturas";
import { ErroEmTempoDeExecucao } from "@designliquido/delegua/excecoes";
import { AcessoMetodoOuPropriedade } from "@designliquido/delegua/construtos";
import { VariavelInterface } from "@designliquido/delegua/interfaces";

import primitivasDicionario from '@designliquido/delegua/bibliotecas/primitivas-dicionario';
import primitivasNumero from '@designliquido/delegua/bibliotecas/primitivas-numero';
import primitivasTexto from '@designliquido/delegua/bibliotecas/primitivas-texto';
import primitivasVetor from '@designliquido/delegua/bibliotecas/primitivas-vetor';
import tipoDeDadosDelegua from "@designliquido/delegua/tipos-de-dados/delegua";

import { inferirTipoVariavel } from "./inferenciador-liquido";

/**
 * A única função deste interpretador é resolver bugs que precisam ser repassados
 * para o núcleo de Delégua.
 */
export class InterpretadorLiquido extends InterpretadorComImportacao {
    // TODO: Depreciar na versão 0.50.1 de Delégua.
    override async visitarExpressaoAcessoMetodoOuPropriedade(
        expressao: AcessoMetodoOuPropriedade
    ): Promise<any> {
        const nomeObjeto = this.resolverNomeObjectoAcessado(expressao.objeto);
        let variavelObjeto: VariavelInterface = await this.avaliar(expressao.objeto);

        // Este caso acontece quando há encadeamento de métodos.
        // Por exemplo, `objeto1.metodo1().metodo2()`.
        // Como `RetornoQuebra` também possui `valor`, precisamos extrair o
        // valor dele primeiro.
        if (variavelObjeto.constructor && variavelObjeto.constructor.name === 'RetornoQuebra') {
            variavelObjeto = variavelObjeto.valor;
        }

        const objeto = this.resolverValor(variavelObjeto);

        if (objeto.constructor && objeto.constructor.name === 'ObjetoDeleguaClasse') {
            return (objeto as ObjetoDeleguaClasse).obter(expressao.simbolo);
        }

        // Objeto simples do JavaScript, ou dicionário de Delégua.
        if (objeto.constructor === Object) {
            if (expressao.simbolo.lexema in primitivasDicionario) {
                const metodoDePrimitivaDicionario: Function =
                    primitivasDicionario[expressao.simbolo.lexema].implementacao;
                return new MetodoPrimitiva(nomeObjeto, objeto, metodoDePrimitivaDicionario);
            }

            return objeto[expressao.simbolo.lexema];
        }

        // A partir daqui, presume-se que o objeto é uma das estruturas
        // de Delégua.
        if (objeto instanceof DeleguaModulo) {
            return objeto.componentes[expressao.simbolo.lexema] || null;
        }

        let tipoObjeto = variavelObjeto.tipo;
        if (tipoObjeto === null || tipoObjeto === undefined) {
            tipoObjeto = inferirTipoVariavel(variavelObjeto as any) as any;
        }

        // Como internamente um dicionário de Delégua é simplesmente um objeto de
        // JavaScript, as primitivas de dicionário, especificamente, são tratadas
        // mais acima.
        switch (tipoObjeto) {
            case tipoDeDadosDelegua.INTEIRO:
            case tipoDeDadosDelegua.NUMERO:
            case tipoDeDadosDelegua.NÚMERO:
                const metodoDePrimitivaNumero: Function =
                    primitivasNumero[expressao.simbolo.lexema].implementacao;
                if (metodoDePrimitivaNumero) {
                    return new MetodoPrimitiva(nomeObjeto, objeto, metodoDePrimitivaNumero);
                }
                break;
            case tipoDeDadosDelegua.TEXTO:
                const metodoDePrimitivaTexto: Function =
                    primitivasTexto[expressao.simbolo.lexema].implementacao;
                if (metodoDePrimitivaTexto) {
                    return new MetodoPrimitiva(nomeObjeto, objeto, metodoDePrimitivaTexto);
                }
                break;
            case tipoDeDadosDelegua.VETOR:
            case tipoDeDadosDelegua.VETOR_INTEIRO:
            case tipoDeDadosDelegua.VETOR_LOGICO:
            case tipoDeDadosDelegua.VETOR_LÓGICO:
            case tipoDeDadosDelegua.VETOR_NUMERO:
            case tipoDeDadosDelegua.VETOR_NÚMERO:
            case tipoDeDadosDelegua.VETOR_QUALQUER:
            case tipoDeDadosDelegua.VETOR_TEXTO:
                const metodoDePrimitivaVetor: Function =
                    primitivasVetor[expressao.simbolo.lexema].implementacao;
                if (metodoDePrimitivaVetor) {
                    return new MetodoPrimitiva(nomeObjeto, objeto, metodoDePrimitivaVetor);
                }
                break;
        }

        // Objeto de uma classe JavaScript regular (ou seja, com construtor e propriedades) 
        // que possua a propriedade.
        // Exemplos: classes de LinConEs, como `RetornoComando`, ou bibliotecas globais com objetos próprios.
        if (objeto.hasOwnProperty && objeto.hasOwnProperty(expressao.simbolo.lexema)) {
            return objeto[expressao.simbolo.lexema];
        }
        
        // Último caso: objeto simples, sem construtor, sem protótipo. Exemplo: {'a': 1, 'b': 2}
        if (typeof objeto[expressao.simbolo.lexema] !== 'undefined') {
            return objeto[expressao.simbolo.lexema];
        }

        return Promise.reject(
            new ErroEmTempoDeExecucao(
                null,
                `Método ou propriedade para objeto ou primitiva não encontrado: ${expressao.simbolo.lexema}.`,
                expressao.linha
            )
        );
    }

    // TODO: Depreciar na versão 0.50.1 de Delégua.
    override resolverValor(objeto: any) {
        if (objeto === null || objeto === undefined) {
            return objeto;
        }

        if (Array.isArray(objeto)) {
            const vetorResolvido: any[] = [];
            for (const elemento of objeto) {
                vetorResolvido.push(this.resolverValor(elemento));
            }

            return vetorResolvido;
        }

        if (objeto instanceof ReferenciaMontao) {
            return this.resolverReferenciaMontao(objeto);
        }

        if (objeto.hasOwnProperty && objeto.hasOwnProperty('valor')) {
            if (Array.isArray(objeto.valor)) {
                return this.resolverValor(objeto.valor);
            }

            if (objeto.valor instanceof ReferenciaMontao) {
                return this.resolverReferenciaMontao(objeto.valor);
            }

            return objeto.valor;
        }

        return objeto;
    }
}