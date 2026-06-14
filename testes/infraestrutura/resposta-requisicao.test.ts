import { DeleguaFuncao } from '@designliquido/delegua/interpretador/estruturas';

import { Requisicao } from '../../fontes/infraestrutura/requisicao';
import { Resposta } from '../../fontes/infraestrutura/resposta';

const obterLexemaPrimeiroParametro = (
    resposta: Resposta,
    nomeMetodo: string
): string =>
    (resposta.metodos[nomeMetodo] as DeleguaFuncao).declaracao.parametros[0].nome
        .lexema;

describe('Testes dos descritores de requisicao e resposta', () => {
    it('Resposta deve declarar propriedades e metodos de resposta do Express', () => {
        const resposta = new Resposta();
        const nomesPropriedades = resposta.propriedades.map(
            (propriedade) => propriedade.nome.lexema
        );

        expect(nomesPropriedades).toEqual([
            'destino',
            'respostaJson',
            'mensagem',
            'statusHttp',
            'valores',
            'visao'
        ]);
        expect(Object.keys(resposta.metodos).sort()).toEqual([
            'enviar',
            'json',
            'lmht',
            'redirecionar',
            'status'
        ]);
        expect(obterLexemaPrimeiroParametro(resposta, 'enviar')).toBe('mensagem');
        expect(obterLexemaPrimeiroParametro(resposta, 'status')).toBe(
            'statusHttp'
        );
        expect(obterLexemaPrimeiroParametro(resposta, 'lmht')).toBe(
            'visaoEValores'
        );
        expect(obterLexemaPrimeiroParametro(resposta, 'json')).toBe('json');
        expect(obterLexemaPrimeiroParametro(resposta, 'redirecionar')).toBe(
            'destino'
        );
    });

    it('Requisicao deve envelopar a requisicao Express e declarar propriedades esperadas', () => {
        const requisicaoExpress = {
            body: { nome: 'Liquido' },
            params: { id: '1' },
            query: { pagina: '2' }
        };
        const requisicao = new Requisicao(requisicaoExpress);
        const nomesPropriedades = requisicao.propriedades.map(
            (propriedade) => propriedade.nome.lexema
        );

        expect(requisicao.requisicaoExpress).toBe(requisicaoExpress);
        expect(nomesPropriedades).toEqual([
            'corpo',
            'parametros',
            'parametrosPesquisa',
            'parametrosCaminho'
        ]);
        expect(requisicao.metodos).toEqual({});
    });
});
