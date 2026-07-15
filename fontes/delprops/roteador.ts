import { DefinicaoPropriedade } from '@designliquido/delprops';

/**
 * Propriedades de configuração do roteador Líquido (`liquido.roteador.*`).
 * Derivadas de {@link ConfiguracaoRoteador}.
 */
const roteador: DefinicaoPropriedade[] = [
    {
        nome: 'diretorioEstatico',
        tipo: 'texto',
        detalhe: 'Caminho do diretório de arquivos estáticos (padrão: \'publico\').',
    },
    {
        nome: 'cors',
        tipo: 'logico',
        detalhe: 'Habilita CORS (padrão: falso).',
    },
    {
        nome: 'origensCors',
        tipo: 'texto',
        detalhe:
            "Origem(ns) permitida(s) para CORS, separadas por vírgula. " +
            "O padrão '*' libera qualquer origem e é adequado apenas para desenvolvimento; " +
            "em produção, restrinja para o(s) domínio(s) da aplicação.",
    },
    {
        nome: 'bodyParser',
        tipo: 'logico',
        detalhe: 'Habilita o body-parser (padrão: verdadeiro).',
    },
    {
        nome: 'morgan',
        tipo: 'logico',
        detalhe: 'Habilita o log de requisições com morgan (padrão: falso).',
    },
    {
        nome: 'cookieParser',
        tipo: 'logico',
        detalhe: 'Habilita o cookie-parser (padrão: verdadeiro).',
    },
    {
        nome: 'passport',
        tipo: 'logico',
        detalhe: 'Habilita o passport para autenticação (padrão: falso).',
    },
    {
        nome: 'json',
        tipo: 'logico',
        detalhe: 'Habilita o suporte a JSON no body (padrão: verdadeiro).',
    },
    {
        nome: 'helmet',
        tipo: 'logico',
        detalhe: 'Habilita o helmet para segurança de cabeçalhos HTTP (padrão: verdadeiro).',
    },
    {
        nome: 'porta',
        tipo: 'numero',
        detalhe: 'Porta na qual o servidor irá subir (padrão: 3000).',
    }
];

export default roteador;
