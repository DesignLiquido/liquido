import { Simbolo } from "@designliquido/delegua";
import {
    FuncaoConstruto,
    Literal,
    Variavel,
} from "@designliquido/delegua/fontes/construtos";
import { Retorna, Var } from "@designliquido/delegua/fontes/declaracoes";
import {
    DeleguaClasse,
    DeleguaFuncao,
} from "@designliquido/delegua/fontes/estruturas";
import { ParametroInterface } from "@designliquido/delegua/fontes/interfaces";

export class Resposta extends DeleguaClasse {
    constructor() {
        const metodos = {};
        metodos["enviar"] = new DeleguaFuncao(
            "enviar",
            new FuncaoConstruto(
                -1,
                -1,
                [
                    {
                        tipo: "padrao",
                        nome: new Simbolo(
                            "IDENTIFICADOR",
                            "qualquerCoisa",
                            null,
                            -1,
                            -1
                        ),
                    } as ParametroInterface,
                ],
                [
                    new Var(
                        new Simbolo(
                            "IDENTIFICADOR",
                            "valorEnviar",
                            null,
                            -1,
                            -1
                        ),
                        new Variavel(
                            -1,
                            new Simbolo(
                                "IDENTIFICADOR",
                                "qualquerCoisa",
                                null,
                                -1,
                                -1
                            )
                        )
                    ),
                    new Retorna(
                        new Simbolo(
                            "IDENTIFICADOR",
                            "qualquerCoisa",
                            null,
                            -1,
                            -1
                        ),
                        new Variavel(
                            -1,
                            new Simbolo("IDENTIFICADOR", "isto", null, -1, -1)
                        )
                    ),
                ]
            ),
            null,
            false
        );
        metodos["status"] = new DeleguaFuncao(
            "status",
            new FuncaoConstruto(
                -1,
                -1,
                [
                    {
                        tipo: "padrao",
                        nome: new Simbolo(
                            "IDENTIFICADOR",
                            "qualquerCoisa",
                            null,
                            -1,
                            -1
                        ),
                    } as ParametroInterface,
                ],
                [
                    new Var(
                        new Simbolo(
                            "IDENTIFICADOR",
                            "valorStatus",
                            null,
                            -1,
                            -1
                        ),
                        new Literal(-1, -1, 200)
                    ),
                    new Retorna(
                        new Simbolo(
                            "IDENTIFICADOR",
                            "qualquerCoisa",
                            null,
                            -1,
                            -1
                        ),
                        new Variavel(
                            -1,
                            new Simbolo("IDENTIFICADOR", "isto", null, -1, -1)
                        )
                    ),
                ]
            ),
            null,
            false
        );
        super("Resposta", null, metodos);
    }
}
