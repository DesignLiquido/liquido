export const listaDeErros = [
    { codigo: 'LIQ00001', palavraChave: 'não encontrado' },
    { codigo: 'LIQ00002', palavraChave: 'não foi definida' },
    { codigo: 'LIQ00003', palavraChave: 'inesperado' },
    // Erro genérico de LinConEs: o driver de banco de dados (SQLite, MySQL, PostgreSQL etc.)
    // rejeitou o comando (violação de restrição, sintaxe SQL inválida, etc.) e a mensagem
    // de erro nativa do driver chegou sem tratamento específico até aqui.
    { codigo: 'LIQ10000', palavraChave: 'sqlite_' },
    { codigo: 'LIQ10000', palavraChave: 'constraint failed' },
];