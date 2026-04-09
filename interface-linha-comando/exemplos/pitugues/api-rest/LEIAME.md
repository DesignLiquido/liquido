# API REST

Este padrão de projeto implementa o que chamamos de API (_Application Programming Interface_, ou Interface de Programação de Aplicação) REST (_Representational State Transfer_, ou Transferência de Estado Representacional).

## Não li e nem lerei

Se você não tem paciência para ler o documento inteiro, colocamos em `rotas/inicial.pitu` um exemplo funcional de rotas trabalhando com JSON. Há um outro documento `LEIAME.md` dentro do diretório `rotas` que pode ajudar.

Se tem, boa leitura.

## Siglas API e REST

É importante entender o que cada uma dessas siglas significa separadamente.

**APIs** normalmente expõem componentes que são usados dentro de uma aplicação, como métodos, propriedades e classes, e são tipicamente distribuídas por pessoas ou empresas para uso por terceiros (ou consumidores). Por definição, uma interface não expõe como esses métodos, propriedades e classes são implementados. A maioria das interfaces possui uma documentação, e esta documentação orienta os consumidores sobre como utilizar cada componente da interface.

**REST** é um dos vários protocolos da Internet. Em REST, uma aplicação expõe uma série de recursos. Cada recurso é acessível através de um conjunto de endereços e métodos.

Cada endereço segue uma convenção que chamamos de URL (_Universal Resource Locator_, ou Localizador Universal de Recurso). _Sites_, ou sítios da internet, usualmente são acessíveis por um endereço que indica qual protocolo de transferência deve ser utilizando (HTTP e FTP são os mais populares, mas há muitos outros), seguido de `://` (dois-pontos e duas barras), um localizador DNS (_Domain Name Server_, ou Servidor de Nomes de Domínio) e um caminho. Por exemplo, `http://designliquido.com.br`. O protocolo é HTTP, e o endereço DNS da empresa que construiu Líquido é `designliquido.com.br` (`.com` quer dizer que é um sítio comercial, e `.br` quer dizer que fica no Brasil).

Ao acessar o sítio da Design Líquido no seu navegador de internet, o navegador assume um método (ou verbo) padrão. Por padrão, toda e qualquer requisição cujo método não esteja especificado usa o método `GET` (obter). Este método indica que queremos ler o conteúdo correspondente ao endereço. O servidor da Design Líquido irá receber esta requisição, montar uma página em HTML e devolver.

Todo sítio da internet é, por definição, uma API REST, que normalmente nos devolve HTML como retorno, mas nada nos impediria de retornar qualquer outra coisa serializável. HTML, XML e JSON são exemplos de formatos serializáveis.

APIs REST se tornaram muito populares com a criação de _smartphones_. Antes dos _smartphones_, um outro padrão de APIs dominava a internet, chamado SOAP. SOAP se parece muito com REST, mas suas APIs trabalhavam apenas com um método (`POST`) e suas respostas são bastante longas e verbosas, o que oneravam sobremaneira e desnecessariamente o processamento em um _smartphone_ da época, bem mais lento e limitado que o _smartphone_ mais barato hoje. Surgiu a necessidade de não apenas simplificar as APIs, como também deixar as respostas menores.

# Serialização

Serialização é um processo de estruturação de dados. Essa estruturação pode ser legível a seres humanos (por exemplo, JSON, XML, YAML) ou não (Protobuf, binário, etc.), sendo os formatos menos legíveis os mais otimizados para uso por máquinas. A serialização é feita por serializadores, e o processo de desestruturação desses dados é chamado de desserialização. Serializadores e desserializadores seguem a especificação do formato que implementam.

Existem centenas de formatos de serialização, que servem a diferentes propósitos. JSON e XML, por exemplo, são muito bons para estruturar dados aninhados, em uma enorme quantidade de detalhes.

A melhor forma de explicar serialização é por exemplos. Vamos supor que queremos construir uma API REST para um blog. O primeiro recurso que queremos implementar é o de leitura de artigos, e vamos supor que temos três artigos já escritos:

- Primeiro artigo
    - Título: O que é REST?
    - Texto: REST significa "Transferência de Estado Representacional".
    - Autor: Leonel
- Segundo artigo
    - Título: O que é API?
    - Texto: API significa "Interface de Programação de Aplicação".
    - Autor: Leonel
- Terceiro artigo
    - Título: Bem-vindos!
    - Texto: Este é meu blog.
    - Autor: Leonel

Se queremos serializar o primeiro artigo em JSON, podemos fazê-lo da seguinte forma:

```json
{
    "titulo": "O que é REST?",
    "texto": "REST significa 'Transferência de Estado Representacional'.",
    "autor": "Leonel"
}
```

Chaves, aspas duplas, dois-pontos e vírgulas são delimitadores. São usados para definir onde uma porção de informação começa e/ou termina, dependendo do caso. A vírgula, por exemplo, é usada para separar porções de dados. Dois-pontos é usado para separar uma chave de um valor. `"titulo"`, `"texto"` e `"autor"` são, portanto, chaves. O que vem após o sinal de dois-pontos é o valor correspondente a cada chave. Em JSON, todas as chaves são porções de dados delimitadas por aspas duplas, mas valores podem ser delimitados por aspas duplas, chaves, e até mesmo colchetes. Em JSON, o nome "chave" não é à toa: Não é possível um objeto ter duas chaves idênticas.

Colchetes são usados para definir listas de valores. Por exemplo, se queremos definir a lista de artigos numa representação JSON, podemos fazer algo assim:

```json
[
    {
        "titulo": "O que é REST?",
        "texto": "REST significa 'Transferência de Estado Representacional'.",
        "autor": "Leonel"
    },
    {
        "titulo": "O que é API?",
        "texto": "API significa 'Interface de Programação de Aplicação'.",
        "autor": "Leonel"
    },
    {
        "titulo": "Bem-vindos!",
        "texto": "Este é meu blog.",
        "autor": "Leonel"
    }
]
```

Ou seja, temos três artigos, sendo cada artigo delimitado por chaves e separado por vírgulas. Cada artigo possui três pares chave-valor, separados por vírgulas. Os três artigos aparecem entre colchetes, indicando uma lista de artigos.

JSON é exatamente poderoso pela recombinação de diversos elementos de dados. Por exemplo, poderíamos fazer nosso recurso de listagem de artigos devolver não apenas uma lista de artigos, mas informações adicionais sobre eles. Por exemplo:

```json
{
    "pagina": "Meu blog",
    "totalArtigos": 3,
    "artigos": [
        {
            "titulo": "O que é REST?",
            "texto": "REST significa 'Transferência de Estado Representacional'.",
            "autor": "Leonel"
        },
        {
            "titulo": "O que é API?",
            "texto": "API significa 'Interface de Programação de Aplicação'.",
            "autor": "Leonel"
        },
        {
            "titulo": "Bem-vindos!",
            "texto": "Este é meu blog.",
            "autor": "Leonel"
        }
    ]
}
```

Ou seja, aninhamos os artigos como valor de uma chave `"artigos"`, dentro de um outro objeto, com outras chaves, que contém valores de diferentes tipos. Números, por exemplo, não requerem delimitadores.

## Serialização para JSON em Líquido

O método `.json()` do objeto `resposta` serializa um dicionário em Pituguês para a representação JSON. Dicionários em Pituguês são muito parecidos com objetos JSON, com algumas diferenças:

- Dicionários em Pituguês permitem chaves como números. Objetos JSON permitem apenas chaves delimitadas por aspas duplas.

Para usar, basta passar qualquer dicionário, seja literal ou variável, como argumento de `resposta.json()`:

```js
@liquido.rotaGet("/")
funcao minha_rota(requisicao, resposta):
    resposta.json([{
        "id": 1,
        "titulo": "teste 1",
        "descricao": "descricao 1"
    }])
```

## Auto-documentação

Para projetos REST, Liquido possui capacidades de auto-documentação, ou seja, gerar uma série de documentos que explicam como a API REST que você está escrevendo irá funcionar.

Uma boa parte dos elementos são depreendidos pelo método de rota usado, o tipo de retorno usado para a resposta, e assim por diante. Outros podem ser adicionados por decoradores.

Do exemplo anterior:

```js
@liquido.rotaGet("/")
funcao minha_rota(requisicao, resposta):
    resposta.json([{
        "id": 1,
        "titulo": "teste 1",
        "descricao": "descricao 1"
    }])
```

- Sabemos a rota pela posição do arquivo controlador na estrutura de diretórios;
- Sabemos que a rota responde pelo método `GET`;
- Sabemos que o tipo da resposta é feito por `resposta.json()`, portanto, um conteúdo JSON.

Nosso modelo de auto-documentação é o [OpenAPI 3.1.0](https://swagger.io/specification/). A geração dessa documentação pode ser feita de duas maneiras:

- Na inicialização do servidor;
- Por linha de comando.

### Decoradores para auto-documentação

Os decoradores suportados atualmente estão como no exemplo abaixo:

```js
@rest.documentacao(
    sumario = "Um exemplo de rota GET.",
    descricao = "Uma descrição mais detalhada sobre como a rota GET funciona.",
    idOperacao = "lerArtigos",
    etiquetas = ["artigos"]
)
@rest.resposta(
    codigo = 200,
    descricao = "Devolvido com sucesso",
    formatos = ["application/json", "application/xml"]
)
@liquido.rotaGet("/")
funcao minha_rota(requisicao, resposta):
    resposta.json([{
        "id": 1,
        "titulo": "teste 1",
        "descricao": "descricao 1"
    }])
```