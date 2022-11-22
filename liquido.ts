import * as caminho from "path";
import * as sistemaDeArquivos from "node:fs";

import Handlebars from "handlebars";

import {
  AvaliadorSintatico,
  ErroAvaliadorSintatico,
  Importador,
  Interpretador,
  Lexador,
  Simbolo,
} from "@designliquido/delegua";
import {
  AcessoMetodo,
  Chamada,
  Construto,
  FuncaoConstruto,
  Variavel,
} from "@designliquido/delegua/fontes/construtos";
import { Expressao } from "@designliquido/delegua/fontes/declaracoes";
import { DeleguaFuncao } from "@designliquido/delegua/fontes/estruturas";
import { SimboloInterface } from "@designliquido/delegua/fontes/interfaces";
import { ConversorLmht } from "@designliquido/lmht-js";

import { Resposta } from "./infraestrutura";
import { Roteador } from "./infraestrutura/roteador";
import { LiquidoInterface } from "./interfaces/interface-liquido";
import { ErroLexador } from "@designliquido/delegua/fontes/lexador/erro-lexador";

/**
 * O núcleo do framework.
 */
export class Liquido implements LiquidoInterface {
  importador: Importador;
  interpretador: Interpretador;
  conversorLmht: ConversorLmht;
  roteador: Roteador;

  arquivosDelegua: Array<string>;
  rotasDelegua: Array<string>;
  diretorioBase: string = __dirname;
  diretorioDescobertos: string[] = [];

  arquivosAbertos: { [identificador: string]: string };
  conteudoArquivosAbertos: { [identificador: string]: string[] };

  // errosLexador: ErroLexador[] = [];
  // errosAvaliadorSintatico: ErroAvaliadorSintatico[] = [];

  constructor() {
    this.arquivosAbertos = {};
    this.conteudoArquivosAbertos = {};

    this.importador = new Importador(
      new Lexador(),
      new AvaliadorSintatico(),
      this.arquivosAbertos,
      this.conteudoArquivosAbertos,
      false
    );
    this.conversorLmht = new ConversorLmht();
    this.interpretador = new Interpretador(
      this.importador,
      process.cwd(),
      false,
      console.log
    );
    this.roteador = new Roteador(this.conversorLmht);
  }

  async iniciar(): Promise<void> {
    this.importarArquivosRotas();

    this.roteador.iniciar();
  }

  descobrirRotas(diretorio: string): void {
    const ListaDeItems = sistemaDeArquivos.readdirSync(diretorio);

    const diretorioDescobertos = [];

    ListaDeItems.forEach((diretorioOuArquivo) => {
      const caminhoAbsoluto = caminho.join(diretorio, diretorioOuArquivo);
      if (caminhoAbsoluto.endsWith(".delegua")) {
        this.arquivosDelegua.push(caminhoAbsoluto);
        return;
      }
      if (sistemaDeArquivos.lstatSync(caminhoAbsoluto).isDirectory()) {
        diretorioDescobertos.push(caminhoAbsoluto);
        return;
      }
    });
    diretorioDescobertos.forEach((diretorioDescoberto) => {
      this.descobrirRotas(diretorioDescoberto);
    });
  }

  /**
   * Ele pega um caminho de arquivo e retorna uma rota
   * @param {string} caminhoArquivo - string =&gt; O caminho do arquivo que está sendo lido
   * @returns A rota resolvida.
   */
  resolverCaminhoRota(caminhoArquivo: string): string {
    const partesArquivo = caminhoArquivo.split("rotas");
    const rotaResolvida = partesArquivo[1]
      .replace("inicial.delegua", "")
      .replace(".delegua", "")
      .replace(new RegExp(`\\${caminho.sep}`, "g"), "/")
      .replace(new RegExp(`/$`, "g"), "");
    return rotaResolvida;
  }

  importarArquivosRotas(): void {
    this.arquivosDelegua = [];
    this.rotasDelegua = [];
    this.descobrirRotas(caminho.join(this.diretorioBase, "rotas"));

    for (let arquivo of this.arquivosDelegua) {
      const retornoImportador = this.importador.importar(arquivo);

      retornoImportador.retornoLexador.erros.forEach((erro) =>
        this.roteador.errosLexador.push(erro)
      );

      retornoImportador.retornoAvaliadorSintatico.erros.forEach((erro) =>
        this.roteador.errosAvaliadorSintatico.push(erro)
      );

      // Liquido espera declarações do tipo Expressao, contendo dentro
      // um Construto do tipo Chamada.
      for (let declaracao of retornoImportador.retornoAvaliadorSintatico
        .declaracoes) {
        const expressao: Chamada = (declaracao as Expressao)
          .expressao as Chamada;
        const entidadeChamada: AcessoMetodo =
          expressao.entidadeChamada as AcessoMetodo;
        const objeto = entidadeChamada.objeto as Variavel;
        const metodo = entidadeChamada.simbolo as SimboloInterface;
        if (objeto.simbolo.lexema.toLowerCase() === "liquido") {
          switch (metodo.lexema) {
            case "rotaGet":
              this.adicionarRotaGet(
                this.resolverCaminhoRota(arquivo),
                expressao.argumentos
              );
              break;
            case "rotaPost":
              this.adicionarRotaPost(
                this.resolverCaminhoRota(arquivo),
                expressao.argumentos
              );
              break;
            case "rotaPut":
              this.adicionarRotaPut(
                this.resolverCaminhoRota(arquivo),
                expressao.argumentos
              );
              break;
            case "rotaDelete":
              this.adicionarRotaDelete(
                this.resolverCaminhoRota(arquivo),
                expressao.argumentos
              );
              break;
            case "rotaPatch":
              this.adicionarRotaPatch(
                this.resolverCaminhoRota(arquivo),
                expressao.argumentos
              );
              break;
            case "rotaOptions":
              this.adicionarRotaDelete(
                this.resolverCaminhoRota(arquivo),
                expressao.argumentos
              );
              break;
            case "rotaCopy":
              this.adicionarRotaCopy(
                this.resolverCaminhoRota(arquivo),
                expressao.argumentos
              );
              break;
            case "rotaHead":
              this.adicionarRotaHead(
                this.resolverCaminhoRota(arquivo),
                expressao.argumentos
              );
              break;
            case "rotaLock":
              this.adicionarRotaLock(
                this.resolverCaminhoRota(arquivo),
                expressao.argumentos
              );
              break;
            case "rotaUnlock":
              this.adicionarRotaUnlock(
                this.resolverCaminhoRota(arquivo),
                expressao.argumentos
              );
              break;
            case "rotaPurge":
              this.adicionarRotaPurge(
                this.resolverCaminhoRota(arquivo),
                expressao.argumentos
              );
              break;
            case "rotaPropfind":
              this.adicionarRotaPropfind(
                this.resolverCaminhoRota(arquivo),
                expressao.argumentos
              );
              break;
            default:
              console.log(`Método ${metodo.lexema} não reconhecido.`);
              break;
          }
        }
      }
    }
  }

  /**
   * O Interpretador Delégua exige alguns parâmetros definidos antes de executar.
   * Esse método define esses parâmetros na posição inicial da pilha de execução
   * do Interpretador.
   * @param requisicao O objeto de requisição do Express.
   * @param nomeFuncao O nome da função a ser chamada pelo Interpretador.
   * @param funcaoConstruto O conteúdo da função, declarada no arquivo `.delegua` correspondente.
   */
  prepararRequisicao(
    requisicao: any,
    nomeFuncao: string,
    funcaoConstruto: FuncaoConstruto
  ) {
    this.interpretador.pilhaEscoposExecucao.definirVariavel(
      "requisicao",
      requisicao
    );
    this.interpretador.pilhaEscoposExecucao.definirVariavel(
      "resposta",
      new Resposta().chamar(this.interpretador, [])
    );

    const funcaoRetorno = new DeleguaFuncao(nomeFuncao, funcaoConstruto);
    this.interpretador.pilhaEscoposExecucao.definirVariavel(
      nomeFuncao,
      funcaoRetorno
    );
  }

  /**
   * Chamada ao Interpretador Delégua com a estrutura declarativa para a
   * execução da função nomeada na rota.
   * @param nomeFuncao O nome da função da rota.
   * @returns O resultado da interpretação.
   */
  async chamarInterpretador(nomeFuncao: string) {
    return await this.interpretador.interpretar(
      [
        new Expressao(
          new Chamada(
            -1,
            new Variavel(
              -1,
              new Simbolo("IDENTIFICADOR", nomeFuncao, null, -1, -1)
            ),
            new Simbolo("PARENTESE_DIREITO", "", null, -1, -1),
            [
              new Variavel(
                -1,
                new Simbolo("IDENTIFICADOR", "requisicao", null, -1, -1)
              ),
              new Variavel(
                -1,
                new Simbolo("IDENTIFICADOR", "resposta", null, -1, -1)
              ),
            ]
          )
        ),
      ],
      true
    );
  }

  /**
   * Aplica transformações Handlebars e LMHT no arquivo de visão correspondente
   * à rota.
   * @param arquivoRota Caminho completo do arquivo da rota.
   * @param valores Valores que devem ser usados na aplicação do Handlebars.
   * @returns O resultado das duas conversões.
   */
  async resolverRetornoLmht(arquivoRota: string, valores: any) {
    const visaoCorrespondente = arquivoRota
      .replace("rotas", "visoes")
      .replace("delegua", "lmht");
    const arquivoBase: Buffer =
      sistemaDeArquivos.readFileSync(visaoCorrespondente);
    const conteudoDoArquivo: string = arquivoBase.toString();
    let textoBase = conteudoDoArquivo;

    if (valores) {
      const template = Handlebars.compile(conteudoDoArquivo);
      textoBase = template(valores);
    }

    return await this.conversorLmht.converterPorTexto(textoBase);
  }

  /**
   * Configuração de uma rota GET no roteador Express.
   * @param caminhoRota O caminho completo do arquivo que define a rota.
   * @param argumentos Todas as funções em Delégua que devem ser executadas
   *                   para a resolução da rota. Por enquanto apenas a primeira
   *                   função é executada.
   */
  adicionarRotaGet(caminhoRota: string, argumentos: Construto[]) {
    const funcao = argumentos[0] as FuncaoConstruto;

    this.roteador.rotaGet(caminhoRota, async (req, res) => {
      this.prepararRequisicao(req, "funcaoRotaGet", funcao);

      const retorno = await this.chamarInterpretador("funcaoRotaGet");

      // O resultado que interessa é sempre o último.
      // Ele vem como string, e precisa ser desserializado para ser usado.
      const { valor } = JSON.parse(retorno.resultado.pop());
      if (valor.campos.lmht) {
        const resultado = await this.resolverRetornoLmht(
          caminhoRota,
          valor.campos.valores
        );
        res.send(resultado);
      } else if (valor.campos.mensagem) {
        res.send(valor.campos.mensagem);
      }

      if (valor.campos.statusHttp) {
        res.status(valor.campos.statusHttp);
      }
    });
  }

  adicionarRotaPost(caminhoRota: string, argumentos: Construto[]): void {
    const funcao = argumentos[0] as FuncaoConstruto;

    this.roteador.rotaPost(caminhoRota, async (req, res) => {
      this.prepararRequisicao(req, "funcaoRotaPost", funcao);

      const retorno = await this.chamarInterpretador("funcaoRotaPost");

      // O resultado que interessa é sempre o último.
      // Ele vem como string, e precisa ser desserializado para ser usado.
      const { valor } = JSON.parse(retorno.resultado.pop());

      if (valor.campos.lmht) {
        const resultado = await this.resolverRetornoLmht(
          caminhoRota,
          valor.campos.lmht
        );
        res.send(resultado);
      } else if (valor.campos.mensagem) {
        res.send(valor.campos.mensagem);
      }

      if (valor.campos.statusHttp) {
        res.status(valor.campos.statusHttp);
      }
    });
  }

  adicionarRotaPut(caminhoRota: string, argumentos: Construto[]): void {
    const funcao = argumentos[0] as FuncaoConstruto;

    this.roteador.rotaPut(caminhoRota, async (req, res) => {
      this.prepararRequisicao(req, "funcaoRotaPut", funcao);

      const retorno = await this.chamarInterpretador("funcaoRotaPut");

      // O resultado que interessa é sempre o último.
      // Ele vem como string, e precisa ser desserializado para ser usado.
      const { valor } = JSON.parse(retorno.resultado.pop());

      if (valor.campos.lmht) {
        const resultado = await this.resolverRetornoLmht(
          caminhoRota,
          valor.campos.lmht
        );
        res.send(resultado);
      } else if (valor.campos.mensagem) {
        res.send(valor.campos.mensagem);
      }

      if (valor.campos.statusHttp) {
        res.status(valor.campos.statusHttp);
      }
    });
  }

  adicionarRotaDelete(caminhoRota: string, argumentos: Construto[]): void {
    const funcao = argumentos[0] as FuncaoConstruto;

    this.roteador.rotaDelete(caminhoRota, async (req, res) => {
      this.prepararRequisicao(req, "funcaoRotaDelete", funcao);

      const retorno = await this.chamarInterpretador("funcaoRotaDelete");

      // O resultado que interessa é sempre o último.
      // Ele vem como string, e precisa ser desserializado para ser usado.
      const { valor } = JSON.parse(retorno.resultado.pop());

      if (valor.campos.lmht) {
        const resultado = await this.resolverRetornoLmht(
          caminhoRota,
          valor.campos.lmht
        );
        res.send(resultado);
      } else if (valor.campos.mensagem) {
        res.send(valor.campos.mensagem);
      }

      if (valor.campos.statusHttp) {
        res.status(valor.campos.statusHttp);
      }
    });
  }
  adicionarRotaPatch(caminhoRota: string, argumentos: Construto[]): void {
    const funcao = argumentos[0] as FuncaoConstruto;

    this.roteador.rotaPatch(caminhoRota, async (req, res) => {
      this.prepararRequisicao(req, "funcaoRotaPatch", funcao);

      const retorno = await this.chamarInterpretador("funcaoRotaPatch");

      // O resultado que interessa é sempre o último.
      // Ele vem como string, e precisa ser desserializado para ser usado.
      const { valor } = JSON.parse(retorno.resultado.pop());

      if (valor.campos.lmht) {
        const resultado = await this.resolverRetornoLmht(
          caminhoRota,
          valor.campos.lmht
        );
        res.send(resultado);
      } else if (valor.campos.mensagem) {
        res.send(valor.campos.mensagem);
      }

      if (valor.campos.statusHttp) {
        res.status(valor.campos.statusHttp);
      }
    });
  }

  adicionarRotaOptions(caminhoRota: string, argumentos: Construto[]): void {
    const funcao = argumentos[0] as FuncaoConstruto;

    this.roteador.rotaOptions(caminhoRota, async (req, res) => {
      this.prepararRequisicao(req, "funcaoRotaOptions", funcao);

      const retorno = await this.chamarInterpretador("funcaoRotaOptions");

      // O resultado que interessa é sempre o último.
      // Ele vem como string, e precisa ser desserializado para ser usado.
      const { valor } = JSON.parse(retorno.resultado.pop());

      if (valor.campos.lmht) {
        const resultado = await this.resolverRetornoLmht(
          caminhoRota,
          valor.campos.lmht
        );
        res.send(resultado);
      } else if (valor.campos.mensagem) {
        res.send(valor.campos.mensagem);
      }

      if (valor.campos.statusHttp) {
        res.status(valor.campos.statusHttp);
      }
    });
  }

  adicionarRotaCopy(caminhoRota: string, argumentos: Construto[]): void {
    const funcao = argumentos[0] as FuncaoConstruto;

    this.roteador.rotaCopy(caminhoRota, async (req, res) => {
      this.prepararRequisicao(req, "funcaoRotaCopy", funcao);

      const retorno = await this.chamarInterpretador("funcaoRotaCopy");

      // O resultado que interessa é sempre o último.
      // Ele vem como string, e precisa ser desserializado para ser usado.
      const { valor } = JSON.parse(retorno.resultado.pop());

      if (valor.campos.lmht) {
        const resultado = await this.resolverRetornoLmht(
          caminhoRota,
          valor.campos.lmht
        );
        res.send(resultado);
      } else if (valor.campos.mensagem) {
        res.send(valor.campos.mensagem);
      }

      if (valor.campos.statusHttp) {
        res.status(valor.campos.statusHttp);
      }
    });
  }

  adicionarRotaHead(caminhoRota: string, argumentos: Construto[]): void {
    const funcao = argumentos[0] as FuncaoConstruto;

    this.roteador.rotaHead(caminhoRota, async (req, res) => {
      this.prepararRequisicao(req, "funcaoRotaHead", funcao);

      const retorno = await this.chamarInterpretador("funcaoRotaHead");

      // O resultado que interessa é sempre o último.
      // Ele vem como string, e precisa ser desserializado para ser usado.
      const { valor } = JSON.parse(retorno.resultado.pop());

      if (valor.campos.lmht) {
        const resultado = await this.resolverRetornoLmht(
          caminhoRota,
          valor.campos.lmht
        );
        res.send(resultado);
      } else if (valor.campos.mensagem) {
        res.send(valor.campos.mensagem);
      }

      if (valor.campos.statusHttp) {
        res.status(valor.campos.statusHttp);
      }
    });
  }

  adicionarRotaLock(caminhoRota: string, argumentos: Construto[]): void {
    const funcao = argumentos[0] as FuncaoConstruto;

    this.roteador.rotaLock(caminhoRota, async (req, res) => {
      this.prepararRequisicao(req, "funcaoRotaLock", funcao);

      const retorno = await this.chamarInterpretador("funcaoRotaLock");

      // O resultado que interessa é sempre o último.
      // Ele vem como string, e precisa ser desserializado para ser usado.
      const { valor } = JSON.parse(retorno.resultado.pop());

      if (valor.campos.lmht) {
        const resultado = await this.resolverRetornoLmht(
          caminhoRota,
          valor.campos.lmht
        );
        res.send(resultado);
      } else if (valor.campos.mensagem) {
        res.send(valor.campos.mensagem);
      }

      if (valor.campos.statusHttp) {
        res.status(valor.campos.statusHttp);
      }
    });
  }
  adicionarRotaUnlock(caminhoRota: string, argumentos: Construto[]): void {
    const funcao = argumentos[0] as FuncaoConstruto;

    this.roteador.rotaUnlock(caminhoRota, async (req, res) => {
      this.prepararRequisicao(req, "funcaoRotaUnlock", funcao);

      const retorno = await this.chamarInterpretador("funcaoRotaUnlock");

      // O resultado que interessa é sempre o último.
      // Ele vem como string, e precisa ser desserializado para ser usado.
      const { valor } = JSON.parse(retorno.resultado.pop());

      if (valor.campos.lmht) {
        const resultado = await this.resolverRetornoLmht(
          caminhoRota,
          valor.campos.lmht
        );
        res.send(resultado);
      } else if (valor.campos.mensagem) {
        res.send(valor.campos.mensagem);
      }

      if (valor.campos.statusHttp) {
        res.status(valor.campos.statusHttp);
      }
    });
  }
  adicionarRotaPurge(caminhoRota: string, argumentos: Construto[]): void {
    const funcao = argumentos[0] as FuncaoConstruto;

    this.roteador.rotaPurge(caminhoRota, async (req, res) => {
      this.prepararRequisicao(req, "funcaoRotaPurge", funcao);

      const retorno = await this.chamarInterpretador("funcaoRotaPurge");

      // O resultado que interessa é sempre o último.
      // Ele vem como string, e precisa ser desserializado para ser usado.
      const { valor } = JSON.parse(retorno.resultado.pop());

      if (valor.campos.lmht) {
        const resultado = await this.resolverRetornoLmht(
          caminhoRota,
          valor.campos.lmht
        );
        res.send(resultado);
      } else if (valor.campos.mensagem) {
        res.send(valor.campos.mensagem);
      }

      if (valor.campos.statusHttp) {
        res.status(valor.campos.statusHttp);
      }
    });
  }
  adicionarRotaPropfind(caminhoRota: string, argumentos: Construto[]): void {
    const funcao = argumentos[0] as FuncaoConstruto;

    this.roteador.rotaPropfind(caminhoRota, async (req, res) => {
      this.prepararRequisicao(req, "funcaoRotaPropfind", funcao);

      const retorno = await this.chamarInterpretador("funcaoRotaPropfind");

      // O resultado que interessa é sempre o último.
      // Ele vem como string, e precisa ser desserializado para ser usado.
      const { valor } = JSON.parse(retorno.resultado.pop());

      if (valor.campos.lmht) {
        const resultado = await this.resolverRetornoLmht(
          caminhoRota,
          valor.campos.lmht
        );
        res.send(resultado);
      } else if (valor.campos.mensagem) {
        res.send(valor.campos.mensagem);
      }

      if (valor.campos.statusHttp) {
        res.status(valor.campos.statusHttp);
      }
    });
  }
}
