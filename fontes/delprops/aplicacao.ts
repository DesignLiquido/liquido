import { DefinicaoPropriedadeInterface } from '@designliquido/delprops';

/**
 * Propriedades de configuração da aplicação Líquido (`liquido.aplicacao.*`).
 */
const aplicacao: DefinicaoPropriedadeInterface[] = [
    {
        nome: 'nome',
        tipo: 'texto',
        detalhe: 'Nome da aplicação.',
    },
    {
        nome: 'versao',
        tipo: 'texto',
        detalhe: 'Versão da aplicação.',
    },
    {
        nome: 'descricao',
        tipo: 'texto',
        detalhe: 'Descrição da aplicação.',
    },
    {
        nome: 'licenca.nome',
        tipo: 'texto',
        detalhe: 'Nome da licença da aplicação.',
    },
    {
        nome: 'licenca.url',
        tipo: 'texto',
        detalhe: 'URL da licença da aplicação.',
    },
];

export default aplicacao;
