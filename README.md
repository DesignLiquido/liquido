# Liquido

Conjunto de ferramentas para desenvolvimento de aplicações para a internet 100% em português.

## Motivação

- [Delégua](https://github.com/DesignLiquido/delegua) é uma linguagem de programação 100% em português;
- [LMHT](https://github.com/DesignLiquido/LMHT) é uma linguagem de marcação 100% em português, feita para estruturar páginas de internet;
- [FolEs](https://github.com/DesignLiquido/FolEs) é uma linguagem para folhas de estilo, que estilizam páginas de internet.

Liquido é um ferramentário que combina as três linguagens para ser possível desenvolver para a internet 100% em português.

## Inspiração

A maior inspiração deste projeto é a [FastAPI](https://fastapi.tiangolo.com/), mas também há influência do [Next.js](https://nextjs.org/).

Algumas ideias retiradas desses projetos:

- Rotas montadas por convenção: garante coesão do projeto por design, assim como facilita a validação das lógicas das rotas declaradas. Também garante um crescimento natural do projeto de forma ordenada;
- Mínimo de código escrito: programação deve ser uma experiência incrível para cada desenvolvedor, e o conjunto de ferramentas deve colaborar com isso. A inicialização deve ser muito simples e muito rápida, mas o processo não pode ser muito mágico. O desenvolvedor deve ser capaz de compreender facilmente como as coisas funcionam.

## Arquitetura

Para uma implementação inicial, foram escolhidas bibliotecas consagradas do Node.js de desenvolvimento para a Internet:

- [Express](https://www.npmjs.com/package/express), um servidor HTTP;
- [Nodemon](https://nodemon.io/), um observador de sistema de arquivos que recarrega a aplicação quando ha mudanças em certos arquivos e/ou diretórios;
- [Handlebars](https://handlebarsjs.com/), um sistema de _templates_;
- [Helmet](https://helmetjs.github.io/), um _middleware_ para Express.js que define várias configurações de cabeçalho de requisições e respostas que, via de regra, deixam a aplicação mais segura.

Liquido instancia os três componentes básicos de Delégua e os controla, instrumentando instruções escritas em Delégua para JavaScript puro. Isso garante a acessibilidade de se programar em português com o mínimo de impacto no desempenho da aplicação como um todo.

### Convenção de Rotas

Toda e qualquer rota deve ficar em um diretório `rotas`. O arquivo padrão deve ter o nome `inicial.delegua`.

Com isso, se queremos criar uma rota na raiz do site, podemos criar um arquivo `inicial.delegua` com o seguinte:

```js
liquido.rotaGet(funcao(requisicao, resposta) {
    resposta.enviar("Olá mundo").status(200)
})
```

A instrução acima registra uma rota HTTP GET em "/" (por exemplo, `http://localhost:3000/`) que responde com um texto "Olá mundo" e o status HTTP 200.

Se queremos uma rota `http://localhost:3000/teste`, podemos fazer de duas formas:

- Criar um arquivo `teste.delegua` em `/rotas`
- Criar um diretório `teste` dentro de rotas com um arquivo `inicial.delegua`.

Assim como para o diretório `rotas`, todo e qualquer diretório dentro de `rotas` também tem como arquivo padrão o `inicial.delegua`

Cada arquivo só pode ter uma chamada por método HTTP de rota. Por exemplo, um arquivo não pode ter duas chamadas a `liquido.rotaGet()`. Nada impede um arquivo de ter uma chamada para cada tipo de rota. Os métodos são:

- `liquido.rotaGet()`
- `liquido.rotaPost()`
- `liquido.rotaPut()`
- `liquido.rotaDelete()`
- `liquido.rotaPatch()`
- `liquido.rotaCopy()`
- `liquido.rotaHead()`
- `liquido.rotaOptions()`
- `liquido.rotaPurge()`
- `liquido.rotaLock()`
- `liquido.rotaUnlock()`
- `liquido.rotaPropfind()`

Algumas rotas ainda não são suportadas porque o Express.js 4 não as implementou, mas estão marcadas para implementações futuras (Express.js 5, que ainda é _beta_). São elas:

- `liquido.rotaLink()`
- `liquido.rotaUnlink()`
- `liquido.rotaView()`

### Configuração

Liquido procura por um arquivo chamado `configuracao.delegua` na raiz do seu projeto. Nele ficam as configurações globais da aplicação.

### Padrões de Aplicação

Liquido foi pensado para servir qualquer padrão de projeto para aplicações Web. A primeira versão de Liquido garante a implementação dos seguintes padrões:

- MVC (Modelo, Visão, Controle): padrão em três camadas em que o servidor normalmente devolve HTML;
- RESTful API: Padrão em que a aplicação funciona como um serviço não visual, normalmente retornando dados serializáveis como JSON e XML.

Futuras versões de Liquido terão:

- GraphQL
- gRPC