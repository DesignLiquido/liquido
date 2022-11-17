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
  Literal,
  Variavel,
} from "@designliquido/delegua/fontes/construtos";
import { Expressao, FuncaoDeclaracao } from "@designliquido/delegua/fontes/declaracoes";
import { DeleguaFuncao } from "@designliquido/delegua/fontes/estruturas";
import { SimboloInterface } from "@designliquido/delegua/fontes/interfaces";
import { ConversorLmht } from "@designliquido/lmht-js";
import { Resposta } from "./infraestrutura";
import { NucleoBiblioteca } from "./infraestrutura/nucleo-biblioteca";
import { Roteador } from "./roteador";

/**
 * O núcleo do framework.
 */
export class Liquido {
  importador: Importador;
  interpretador: Interpretador;
  conversorLmht: ConversorLmht;
  roteador: Roteador;

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
    const retornoImportador = this.importador.importar(
      "./rotas/inicial.delegua"
    );
    // Liquido espera declarações do tipo Expressao, contendo dentro
    // um Construto do tipo Chamada.
    for (let declaracao of retornoImportador.retornoAvaliadorSintatico
      .declaracoes) {
      const expressao: Chamada = (declaracao as Expressao).expressao as Chamada;
      const entidadeChamada: AcessoMetodo =
        expressao.entidadeChamada as AcessoMetodo;
      const objeto = entidadeChamada.objeto as Variavel;
      const metodo = entidadeChamada.simbolo as SimboloInterface;
      if (objeto.simbolo.lexema.toLowerCase() === "liquido") {
        switch (metodo.lexema) {
          case "rotaGet":
            this.adicionarRotaGet(expressao.argumentos);
            break;
          default:
            console.log(`Método ${metodo.lexema} não reconhecido.`);
            break;
        }
      }
    }
    /* const classeLiquido = new NucleoBiblioteca();
    this.interpretador.pilhaEscoposExecucao.definirVariavel(
        "liquido",
        classeLiquido.chamar(this.interpretador, []));
    const classeResposta = new Resposta();
    this.interpretador.pilhaEscoposExecucao.definirVariavel("requisicao", new Resposta());
    this.interpretador.pilhaEscoposExecucao.definirVariavel(
        "resposta",
        classeResposta.chamar(this.interpretador, []));

    const resultado = await this.interpretador.interpretar(retornoImportador.retornoAvaliadorSintatico
      .declaracoes); */

    this.roteador.iniciar();
  }

  adicionarRotaGet(argumentos: Construto[]) {
    // O primeiro argumento deve ser um literal de texto.
    if (!(argumentos[0] instanceof Literal)) {
      console.log(
        "Primeiro argumento não parece ser um identificador de rota."
      );
      return;
    }

    const rota = (argumentos[0] as Literal).valor;
    const funcao = argumentos[1] as FuncaoConstruto;

    this.roteador.rotaGet(rota, async (req, res) => {
      this.interpretador.pilhaEscoposExecucao.definirVariavel(
        "requisicao",
        req
      );
      this.interpretador.pilhaEscoposExecucao.definirVariavel(
        "resposta",
        new Resposta().chamar(this.interpretador, [])
      );

      const funcaoRetorno = new DeleguaFuncao(
        "funcaoRotaGet",
        funcao
      );
      this.interpretador.pilhaEscoposExecucao.definirVariavel(
        "funcaoRotaGet",
        funcaoRetorno
      );

      const resultado = await this.interpretador.interpretar([
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
      ]);
      res.send("Teste");
      /* this.conversorLmht
        .converterPorArquivo("meu-arquivo.lmht")
        .then((resultado) => {
          res.send(resultado);
        }); */
    });
  }
}
