import * as caminho from "path";
import * as sistemaDeArquivos from "node:fs";

import {
  AvaliadorSintatico,
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
import { Roteador } from "./roteador";

/**
 * O núcleo do framework.
 */
export class Liquido {
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

  async iniciar() {
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

  resolverCaminhoRota(caminhoArquivo: string): string {
    const partesArquivo = caminhoArquivo.split("rotas");
    const rotaResolvida = partesArquivo[1]
      .replace("inicial.delegua", "")
      .replace(".delegua", "")
      .replace(new RegExp(`\\${caminho.sep}`, "g"), "/")
      .replace(new RegExp(`/$`, "g"), "");
    return rotaResolvida;
  }

  importarArquivosRotas() {
    this.arquivosDelegua = [];
    this.rotasDelegua = [];
    this.descobrirRotas(caminho.join(this.diretorioBase, "rotas"));

    for (let arquivo of this.arquivosDelegua) {
      const retornoImportador = this.importador.importar(arquivo);

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
            default:
              console.log(`Método ${metodo.lexema} não reconhecido.`);
              break;
          }
        }
      }
    }
  }

  adicionarRotaGet(caminhoRota: string, argumentos: Construto[]) {
    const funcao = argumentos[0] as FuncaoConstruto;

    this.roteador.rotaGet(caminhoRota, async (req, res) => {
      this.interpretador.pilhaEscoposExecucao.definirVariavel(
        "requisicao",
        req
      );
      this.interpretador.pilhaEscoposExecucao.definirVariavel(
        "resposta",
        new Resposta().chamar(this.interpretador, [])
      );

      const funcaoRetorno = new DeleguaFuncao("funcaoRotaGet", funcao);
      this.interpretador.pilhaEscoposExecucao.definirVariavel(
        "funcaoRotaGet",
        funcaoRetorno
      );

      const retorno = await this.interpretador.interpretar(
        [
          new Expressao(
            new Chamada(
              -1,
              new Variavel(
                -1,
                new Simbolo("IDENTIFICADOR", "funcaoRotaGet", null, -1, -1)
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

      // O resultado que interessa é sempre o último.
      // Ele vem como string, e precisa ser desserializado para ser usado.
      const { valor } = JSON.parse(retorno.resultado.pop());
      if (valor.campos.mensagem) {
        res.send(valor.campos.mensagem)
      }
      
      if (valor.campos.statusHttp) {
        res.status(valor.campos.statusHttp);
      }
      
      /* this.conversorLmht
        .converterPorArquivo("meu-arquivo.lmht")
        .then((resultado) => {
          res.send(resultado);
        }); */
    });
  }
}
