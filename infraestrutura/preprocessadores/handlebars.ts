/**
 * Traduz os termos do Handlebars antes da execução do Handlebars
 */
export class PreprocessadorHandlebars {

    processar(conteudo: string): string {
        conteudo = conteudo.replace(/\{\{#cada/g, '{{#each')
        conteudo = conteudo.replace(/\{\{\/cada/g, '{{/each')
        return conteudo;
    }
}