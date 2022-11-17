import * as caminho from "path";
import * as SistemaDeArquivo from "node:fs";

import { filtroPerformatico } from "./utilidades/filtro-performatico";

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

  importarArquivoRota(caminhoRelativo: string) {
    const caminhoAbsoluto = caminho.join(__dirname, "rotas");

    const arquivosNaPasta = filtroPerformatico(
      (e) => e.endsWith(".delegua"),
      SistemaDeArquivo.readdirSync(caminhoAbsoluto)
    );

    const retornoImportador = this.importador.importar(caminhoAbsoluto);

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
  }

  async iniciar() {
    // TODO: pensar em alguma coisa melhor pra ler diretório rotas recursivamente.
    /* const arquivos = await globby([caminho.join(__dirname, 'rotas') + "\\*.delegua"]);
    arquivos.forEach(arquivo => {
      this.importarArquivoRota(arquivo);
    }); */
    this.importarArquivoRota("inicial.delegua");

    this.roteador.iniciar();
  }

  adicionarRotaGet(argumentos: Construto[]) {
    const funcao = argumentos[0] as FuncaoConstruto;

    this.roteador.rotaGet("/", async (req, res) => {
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

      await this.interpretador.interpretar(
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

      const valorStatus = this.interpretador.pilhaEscoposExecucao.obterVariavel(
        new Simbolo("IDENTIFICADOR", "valorStatus", null, -1, -1)
      );
      const valorEnviar = this.interpretador.pilhaEscoposExecucao.obterVariavel(
        new Simbolo("IDENTIFICADOR", "valorEnviar", null, -1, -1)
      );
      res.send(valorEnviar.valor).status(valorStatus.valor);
      /* this.conversorLmht
        .converterPorArquivo("meu-arquivo.lmht")
        .then((resultado) => {
          res.send(resultado);
        }); */
    });
  }
}
