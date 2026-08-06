import * as sistemaDeArquivos from 'fs';
import * as caminho from 'path';

import Handlebars from 'handlebars';

import { ConversorLmht } from '@designliquido/lmht-js';
import { ObjetoDeleguaClasse } from '@designliquido/delegua/interpretador/estruturas';
import { PreprocessadorFolEs, PreprocessadorHandlebars, PreprocessadorLmhtParciais } from '../preprocessadores';

export class FormatadorLmht {
    conversorLmht: ConversorLmht;
    diretorioBase: string;
    preprocessadorFolEs: PreprocessadorFolEs;
    preprocessadorHandlebars: PreprocessadorHandlebars;
    preprocessadorLmhtParciais: PreprocessadorLmhtParciais;
    private readonly regexParcial = /<parcial nome="([^"]+)".*?(?:\/>|><\/parcial>)/g;
    private readonly regexCorpo = /<corpo>([\s\S]*?)<\/corpo>/;
    private readonly regexCabeca = /<cabeca>([\s\S]*?)<\/cabeca>/;
    private readonly regexConteudoEspecializado = /<conteudo\s*\/>/;
    private readonly nomeArquivoLayout = 'base.lmht';

    constructor(diretorioBase: string) {
        this.conversorLmht = new ConversorLmht();
        this.preprocessadorFolEs = new PreprocessadorFolEs();
        this.preprocessadorHandlebars = new PreprocessadorHandlebars();
        this.preprocessadorLmhtParciais = new PreprocessadorLmhtParciais();
        this.diretorioBase = diretorioBase;
    }

    /**
     * Aplica transformações Handlebars e LMHT no arquivo de visão correspondente
     * à rota.
     * @param caminhoRota Caminho da rota na requisição.
     * @param valores Valores que devem ser usados na aplicação do Handlebars.
     * @returns O resultado das duas conversões.
     */
    async formatar(caminhoRota: string, valores: {[nome: string]: any}): Promise<any> {
        const resolucaoVisao = this.resolverVisaoCorrespondente(caminhoRota);
        if (!resolucaoVisao.visaoCorrespondente) {
            let listaCaminhosTentados: string = 'Caminhos tentados: ';
            for (const caminhoTentado of resolucaoVisao.caminhosTentados) {
                listaCaminhosTentados += caminhoTentado + '; ';
            }

            return Promise.reject(
                `Visão correspondente à rota ${caminhoRota} não existe. ${listaCaminhosTentados}`
            );
        }

        const arquivoBase: Buffer = sistemaDeArquivos.readFileSync(resolucaoVisao.visaoCorrespondente);
        const conteudoDoArquivo: string = arquivoBase.toString();
        let textoBase = conteudoDoArquivo;

        // Preprocessamento: Layout (base.lmht)
        const caminhoLayout = this.resolverLayoutCorrespondente(resolucaoVisao.visaoCorrespondente);
        if (caminhoLayout) {
            textoBase = this.comporComLayout(caminhoLayout, textoBase);
        }

        if (valores) {
            // Preprocessamento: Parciais
            const parciaisResolvidas: string[] = [];
            let parciais: string[] | undefined = [];
            if (this.verificarEstruturaParcial(textoBase)) {
                parciais = this.devolverParciais(textoBase);
                const textoParcial = parciais?.map((parcial) => {
                    return `<lmht><corpo>${parcial}</corpo></lmht>`;
                });
                textoParcial?.map((parcial) => {
                    const result = this.preprocessadorLmhtParciais.processarParciais(parcial);
                    if (result instanceof Error) {
                        throw result;
                    }
                    parciaisResolvidas.push(result.conteudo);
                });
            }

            textoBase = this.formatarTextoBase(textoBase, parciais as string[], parciaisResolvidas);

            // Preprocessamento: Handlebars
            textoBase = this.preprocessadorHandlebars.processar(textoBase);
            const template = Handlebars.compile(textoBase);
            const valoresResolvidos = this.resolverValores(valores);
            textoBase = template(valoresResolvidos);
        }

        // Preprocessamento: FolEs
        textoBase = await this.preprocessadorFolEs.processar(textoBase);

        return this.conversorLmht.converterPorTexto(textoBase);
    }

    private resolverVisaoCorrespondente(
        caminhoRota: string
    ): { visaoCorrespondente: string | undefined, caminhosTentados: string[] } {
        const caminhoRotaNormalizado = caminhoRota.replace(/^\//, '');
        // A estrutura de visões é sempre plana: segmentos de parâmetro (`:id`) não têm
        // pasta correspondente do lado das visões (diferente do lado das rotas, que usa
        // pastas `[id]`), então são removidos do caminho por completo.
        const caminhoRotaSemParametros = caminhoRotaNormalizado.replace(/:[\w]+\/?/gi, '');
        const ultimaParteEhParametro = /:[\w]+$/i.test(caminhoRotaNormalizado);
        const diretorioOuArquivo = caminho.join(this.diretorioBase, 'visoes', caminhoRotaSemParametros);
        const retorno: { visaoCorrespondente: string | undefined, caminhosTentados: string[] } = {
            visaoCorrespondente: undefined,
            caminhosTentados: [
                diretorioOuArquivo,
                diretorioOuArquivo + '.lmht'
            ]
        }

        let visaoCorrespondente: string | undefined;
        if (ultimaParteEhParametro) {
            // Quando o caminho termina em um símbolo de parâmetro, significa que a visão correspondente
            // é a de detalhes.
            visaoCorrespondente = caminho.join(this.diretorioBase, 'visoes', caminhoRotaSemParametros, 'detalhes.lmht');
        } else {
            visaoCorrespondente = caminho.join(this.diretorioBase, 'visoes', caminhoRotaSemParametros + '.lmht');
        }
        
        if (sistemaDeArquivos.existsSync(diretorioOuArquivo)) {
            // É diretório
            if (visaoCorrespondente.endsWith(caminho.sep + '.lmht')) {
                visaoCorrespondente = visaoCorrespondente.replace(caminho.sep + '.lmht', caminho.sep + 'inicial.lmht');
            }
        } 
        
        if (!sistemaDeArquivos.existsSync(visaoCorrespondente)) {
            // Caminho não existe.
            // Se o caminho não termina com `inicial.lmht`, testar existência. 
            // Se não existir, visão correspondente passa a ser a `inicial.lmht`.
            visaoCorrespondente = caminho.join(diretorioOuArquivo, 'inicial.lmht');
            retorno.caminhosTentados.push(visaoCorrespondente);
            if (!sistemaDeArquivos.existsSync(visaoCorrespondente)) {
                // Se ainda assim visão correspondente não existir, indefinir para erro borbulhar
                // nas chamadas superiores.
                visaoCorrespondente = undefined;
            }
        }

        retorno.visaoCorrespondente = visaoCorrespondente;
        return retorno;
    }

    /**
     * Procura o `base.lmht` aplicável a uma visão, subindo do diretório da visão
     * até a raiz de `visoes`. O primeiro `base.lmht` encontrado (mais próximo da
     * visão) é o vencedor — layouts não se acumulam/aninham, um `base.lmht` mais
     * específico sobrescreve por completo o de uma pasta ancestral.
     * @param caminhoVisao Caminho absoluto do arquivo de visão já resolvido.
     * @returns Caminho absoluto do `base.lmht` aplicável, ou `undefined` se nenhum existir.
     */
    private resolverLayoutCorrespondente(caminhoVisao: string): string | undefined {
        const diretorioVisoes = caminho.join(this.diretorioBase, 'visoes');
        let diretorioAtual = caminho.dirname(caminhoVisao);

        while (diretorioAtual.startsWith(diretorioVisoes)) {
            const candidatoLayout = caminho.join(diretorioAtual, this.nomeArquivoLayout);
            if (candidatoLayout !== caminhoVisao && sistemaDeArquivos.existsSync(candidatoLayout)) {
                return candidatoLayout;
            }

            if (diretorioAtual === diretorioVisoes) {
                break;
            }

            diretorioAtual = caminho.dirname(diretorioAtual);
        }

        return undefined;
    }

    /**
     * Compõe o texto de uma visão com seu layout (`base.lmht`).
     * O `<corpo>` da visão é injetado no marcador `<conteudo/>` do layout, e o
     * `<cabeca>` da visão (se houver) é anexado ao `<cabeca>` do layout — ambos
     * sobrevivem, ao invés de um sobrescrever o outro.
     * @param caminhoLayout Caminho absoluto do `base.lmht` a aplicar.
     * @param textoPagina Texto bruto da visão (antes de parciais/Handlebars/FolEs).
     * @returns O texto do layout já com o conteúdo da visão embutido.
     */
    private comporComLayout(caminhoLayout: string, textoPagina: string): string {
        const arquivoLayout: Buffer = sistemaDeArquivos.readFileSync(caminhoLayout);
        let textoLayout = arquivoLayout.toString();

        if (!this.regexConteudoEspecializado.test(textoLayout)) {
            throw new Error(
                `O arquivo de layout '${caminhoLayout}' não contém o marcador '<conteudo/>' ` +
                `onde o conteúdo da visão deveria ser inserido.`
            );
        }

        const corpoPagina = textoPagina.match(this.regexCorpo);
        const corpoPaginaInterno = corpoPagina ? corpoPagina[1] : '';
        textoLayout = textoLayout.replace(this.regexConteudoEspecializado, corpoPaginaInterno);

        const cabecaPagina = textoPagina.match(this.regexCabeca);
        if (cabecaPagina && cabecaPagina[1].trim() !== '') {
            const cabecaPaginaInterna = cabecaPagina[1];
            if (this.regexCabeca.test(textoLayout)) {
                textoLayout = textoLayout.replace(
                    this.regexCabeca,
                    (_match, cabecaLayoutInterna) => `<cabeca>${cabecaLayoutInterna}${cabecaPaginaInterna}</cabeca>`
                );
            } else {
                textoLayout = textoLayout.replace('<lmht>', `<lmht><cabeca>${cabecaPaginaInterna}</cabeca>`);
            }
        }

        return textoLayout;
    }

    /**
     * Resolve valores para o Handlebars, já que alguns objetos retornados pelo núcleo de
     * Delégua não são exatamente dicionários.
     * @param valores Os valores a serem enviados para o Handlebars.
     * @returns Todos os valores normalizados como dicionários, ou ainda dicionários de dicionários.
     */
    private resolverValores(valores: {[nome: string]: any}) {
        const valoresResolvidos = {} as {[nome: string]: any};
        for (const [nome, valor] of Object.entries(valores)) {
            // eslint-disable-next-line no-prototype-builtins
            let valorResolvido = valor.hasOwnProperty('valor') ? valor.valor : valor;
            if (valorResolvido && valorResolvido.constructor === ObjetoDeleguaClasse) {
                valorResolvido = this.obterPropriedadesDeObjetoComoDicionario(valorResolvido);
            }

            valoresResolvidos[nome] = valorResolvido;
        }

        return valoresResolvidos;
    }

    private obterPropriedadesDeObjetoComoDicionario(objeto: ObjetoDeleguaClasse) {
        const dicionarioPropriedades = {} as {[nome: string]: any};
        for (const [nome, valor] of Object.entries(objeto.propriedades)) {
            dicionarioPropriedades[nome] = valor;
        }

        return dicionarioPropriedades;
    }

    private formatarTextoBase(
        textoBase: string,
        listaDeParciais: Array<string>,
        parciaisResolvidos: Array<string>
    ): string {
        for (let i = 0; i < listaDeParciais.length; i++) {
            textoBase = textoBase.replace(listaDeParciais[i], parciaisResolvidos[i]);
        }
        return textoBase;
    }

    private devolverParciais(textoLmht: string): string[] | undefined {
        return textoLmht.match(this.regexParcial)?.map((parcial) => {
            return parcial.toString();
        });
    }

    private verificarEstruturaParcial(textoLmht: string): boolean {
        const matches = textoLmht.match(this.regexParcial);
        return (matches?.length ?? 0) > 0;
    }
}
