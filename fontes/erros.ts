/**
 * Mapeamento de erros de execução para códigos de Liquido.
 *
 * `palavraChave` é comparada (em minúsculas) com a mensagem original do erro.
 * `mensagem`, quando presente, é a explicação amigável em português exibida
 * ao desenvolvedor no console e na resposta HTTP de erro; a mensagem original
 * é preservada como detalhe técnico.
 *
 * `LIQ99999` continua sendo o código de contingência para erros ainda não
 * mapeados. Ao encontrar um LIQ99999 recorrente, o caminho é adicionar aqui
 * uma nova entrada com código próprio e mensagem em português.
 */
export interface ErroMapeadoInterface {
    codigo: string;
    palavraChave: string;
    mensagem?: string;
}

export const listaDeErros: ErroMapeadoInterface[] = [
    { codigo: 'LIQ00001', palavraChave: 'não encontrado' },
    { codigo: 'LIQ00002', palavraChave: 'não foi definida' },
    { codigo: 'LIQ00003', palavraChave: 'inesperado' },
    // Erros vindos do motor JavaScript, normalmente por valores nulos ou
    // indefinidos chegando onde não deviam. A mensagem original (em inglês)
    // é traduzida para orientar quem está começando.
    {
        codigo: 'LIQ20001',
        palavraChave: 'cannot read propert',
        mensagem: 'Tentativa de acessar uma propriedade de um valor nulo ou indefinido.'
    },
    {
        codigo: 'LIQ20002',
        palavraChave: 'is not a function',
        mensagem: 'Tentativa de chamar como função algo que não é uma função.'
    },
    {
        codigo: 'LIQ20003',
        palavraChave: 'is not defined',
        mensagem: 'Uso de um nome que não foi definido.'
    },
    // Erros do interpretador Delégua/Pituguês que já chegam em português,
    // mas merecem código próprio para diagnóstico.
    { codigo: 'LIQ20004', palavraChave: 'só pode chamar função ou classe' },
    // Erro genérico de LinConEs: o driver de banco de dados (SQLite, MySQL, PostgreSQL etc.)
    // rejeitou o comando (violação de restrição, sintaxe SQL inválida, etc.) e a mensagem
    // de erro nativa do driver chegou sem tratamento específico até aqui.
    {
        codigo: 'LIQ10000',
        palavraChave: 'sqlite_',
        mensagem: 'O banco de dados rejeitou o comando executado.'
    },
    {
        codigo: 'LIQ10000',
        palavraChave: 'constraint failed',
        mensagem: 'O banco de dados rejeitou o comando por violação de restrição.'
    }
];
