import { Simbolo } from '@designliquido/delegua/lexador';
import { PropriedadeClasse } from '@designliquido/delegua/declaracoes';
import { DescritorTipoClasse } from '@designliquido/delegua/interpretador/estruturas';
import { Literal } from '@designliquido/delegua';

import { GeradorExpressoes } from './utilidades/gerador-expressoes';

/**
 * A classe de Requisição envelopa todos os aspectos importantes do Express,
 * com algumas adições de comportamento que sejam convenientes para os desenvolvedores.
 */
export class Requisicao extends DescritorTipoClasse {
    requisicaoExpress: any;

    constructor(requisicaoExpress: any) {
        const metodos = {};
        const propriedades = [
            new PropriedadeClasse(
                new Simbolo('IDENTIFICADOR', 'corpo', null, -1, -1),
                'dicionário'
            ),
            new PropriedadeClasse(
                new Simbolo('IDENTIFICADOR', 'parametros', null, -1, -1),
                'dicionário'
            ),
            new PropriedadeClasse(
                new Simbolo('IDENTIFICADOR', 'parametrosPesquisa', null, -1, -1),
                'dicionário'
            ),
            new PropriedadeClasse(
                new Simbolo('IDENTIFICADOR', 'parametrosCaminho', null, -1, -1),
                'dicionário'
            ),
        ];

        // TODO: Provavelmente isso não é aqui. Remover mais futuramente se for o caso.
        /* const geradorExpressoes = new GeradorExpressoes();
        metodos['construtor'] = geradorExpressoes.gerarMetodo('construtor', 
            geradorExpressoes.gerarConstrutoFuncao([], [
                geradorExpressoes.gerarAtribuicaoValorEmPropriedadeClasse('corpo', new Literal(-1, -1, requisicaoExpress.body)),
                geradorExpressoes.gerarAtribuicaoValorEmPropriedadeClasse('parametros', new Literal(-1, -1, requisicaoExpress.params)),
                geradorExpressoes.gerarAtribuicaoValorEmPropriedadeClasse('parametrosPesquisa', new Literal(-1, -1, requisicaoExpress.query)),
                geradorExpressoes.gerarAtribuicaoValorEmPropriedadeClasse('parametrosCaminho', new Literal(-1, -1, requisicaoExpress.path))
            ])
        ); */

        super(
            new Simbolo('IDENTIFICADOR', 'Requisicao', null, -1, -1), 
            null, 
            metodos, 
            propriedades
        );

        this.requisicaoExpress = requisicaoExpress;
    }
}