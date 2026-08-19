import { DefinicaoPropriedadeInterface } from '@designliquido/delprops';

/**
 * Propriedades de configuração da linguagem de back-end Líquido (`liquido.linguagem`).
 */
const linguagem: DefinicaoPropriedadeInterface[] = [
    {
        nome: 'linguagem',
        tipo: 'texto',
        detalhe: 'Linguagem de programação de back-end do projeto.',
        valoresPermitidos: ['delégua', 'pituguês']
    }
];

export default linguagem;
