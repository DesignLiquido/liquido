import { DefinicaoPropriedadeInterface } from '@designliquido/delprops';

/**
 * Propriedades de configuração do arquétipo Líquido (`liquido.arquetipo`).
 */
const arquetipo: DefinicaoPropriedadeInterface[] = [
    {
        nome: 'arquetipo',
        tipo: 'texto',
        detalhe: 'Arquétipo do projeto Líquido.',
        valoresPermitidos: ['rest', 'mvc']
    }
];

export default arquetipo;
