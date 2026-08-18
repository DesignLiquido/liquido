import { DefinicaoPropriedadeInterface } from '@designliquido/delprops';

/**
 * Propriedades de configuração de autenticação Líquido (`liquido.autenticacao.*`).
 * Derivadas de {@link ConfiguracaoAutenticacao}.
 */
const autenticacao: DefinicaoPropriedadeInterface[] = [
    {
        nome: 'tecnologia',
        tipo: 'texto',
        detalhe: 'Tecnologia de autenticação.',
        valoresPermitidos: ['jwt']
    }
];

export default autenticacao;
