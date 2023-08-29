# Liquido

<p align="center">
  <img src="./recursos/imagens/icone-liquido.png" alt="delegua" width="auto" height="130px">
</p>

Conjunto de ferramentas para desenvolvimento de aplicações para a internet 100% em português.

<p align="center">
  <a href="https://github.com/DesignLiquido/liquido/issues" target="_blank">
    <img src="https://img.shields.io/github/issues/Designliquido/liquido" />
  </a>
  <img src="https://img.shields.io/github/stars/Designliquido/liquido" />
  <img src="https://img.shields.io/github/forks/Designliquido/liquido" />
  <a href="https://www.npmjs.com/package/liquido" target="_blank">
    <img src="https://img.shields.io/npm/v/liquido" />
  </a>
  <img src="https://img.shields.io/github/license/Designliquido/liquido" />
</p>

## Motivação

- [Delégua](https://github.com/DesignLiquido/delegua) é uma linguagem de programação 100% em português;
- [LMHT](https://github.com/DesignLiquido/LMHT) é uma linguagem de marcação 100% em português, feita para estruturar páginas de internet;
- [FolEs](https://github.com/DesignLiquido/FolEs) é uma linguagem para folhas de estilo, que estilizam páginas de internet.

Liquido é um ferramentário que combina as três linguagens para ser possível desenvolver para a internet 100% em português.

## Instalação

Você deve ter o [Node.js](https://nodejs.org/pt-br/download/) instalado.

Depois de instalar no Node.js, execute o seguinte comando no diretório em que seu projeto está:

```sh
npm i liquido
```

Se preferir usar o [Yarn](https://yarnpkg.com/) ao invés do NPM, use:

```sh
yarn add liquido
```

Isso deve criar um arquivo `package.json` com algumas informações de dependências. Neste arquivo, adicione o seguinte:

```json
  "scripts": {
    "liquido": "node ./node_modules/liquido/index.js"
  }
```

### Uso com Nodemon

Se quiser usar liquido com o [nodemon](https://nodemon.io/) para que a aplicação seja recarregada toda vez que houver alteração nos fontes, primeiro instale o nodemon:

```sh
npm install -g nodemon
```

Modifique seu script para o seguinte:

```json
  "scripts": {
    "liquido": "nodemon ./node_modules/liquido/index.js"
  }
```

## Olá mundo em liquido

Crie no seu projeto um diretório chamado `rotas`. Depois, crie dentro de `rotas` um arquivo chamado `inicial.delegua`.

Dentro de `inicial.delegua`, adicione o seguinte:

```js
liquido.rotaGet(funcao(requisicao, resposta) {
  resposta.enviar("Olá mundo").status(200)
})
```

Execute liquido usando o seguinte comando:

```sh
yarn liquido
```

Ou, se preferir o NPM:

```sh
npm run liquido
```

Isso deve iniciar um servidor HTTP na porta 3000. Experimente entrar em http://localhost:3000. A mensagem "Olá mundo" deve aparecer.

## Inspiração

A maior inspiração deste projeto é a [FastAPI](https://fastapi.tiangolo.com/), mas também há influência de:

- [Next.js](https://nextjs.org/)
- [Nuxt.js](https://nuxtjs.org/)
- [Ruby on Rails](https://rubyonrails.org/)
- [Nyan](https://github.com/bucknellu/Nyan)

Algumas ideias retiradas desses projetos:

- Rotas montadas por convenção: garante coesão do projeto por design, assim como facilita a validação das lógicas das rotas declaradas. Também garante um crescimento natural do projeto de forma ordenada;
- Mínimo de código escrito: programação deve ser uma experiência incrível para cada desenvolvedor, e o conjunto de ferramentas deve colaborar com isso. A inicialização deve ser muito simples e muito rápida, mas o processo não pode ser muito mágico: o desenvolvedor deve ser capaz de compreender facilmente como as coisas funcionam;
- Foco nos fundamentos: como servidores HTTP funcionam, quais são as premissas de REST, o que está por trás de cada tecnologia;
- Auto-descoberta de componentes: o ferramentário deve ser capaz de descobrir o que está habilitado no projeto olhando alguns arquivos e diretórios, e inicializando tudo isso automaticamente.

## Arquitetura

Para uma implementação inicial, foram escolhidas bibliotecas consagradas do Node.js de desenvolvimento para a Internet:

- [Express](https://www.npmjs.com/package/express), um servidor HTTP;
- [Nodemon](https://nodemon.io/), um observador de sistema de arquivos que recarrega a aplicação quando há mudanças em certos arquivos e/ou diretórios;
- [Handlebars](https://handlebarsjs.com/), um sistema de _templates_;
- [Helmet](https://helmetjs.github.io/), um _middleware_ para Express.js que define várias configurações de cabeçalho de requisições e respostas que, via de regra, deixam a aplicação mais segura;
- [Morgan](https://github.com/expressjs/morgan), um _middleware_ para estenografia de requisições HTTP, enviando mensagens úteis para desenvolvedores em console;
- [Cors](https://www.npmjs.com/package/cors), um _middleware_ para restringir certas origens de enviar requisições para a aplicação em liquido. É considerado um requisito essencial de segurança;
- [Passport](https://www.passportjs.org/), um _middleware_ básico de autenticação;
- [Cookie Parser](https://www.npmjs.com/package/cookie-parser), um _middleware_ para interpretação de _cookies_ que venham em requisições.

Liquido instancia os três componentes básicos de Delégua e os controla, instrumentando instruções escritas em Delégua para JavaScript puro. Isso garante a acessibilidade de se programar em português com o mínimo de impacto no desempenho da aplicação como um todo, além da eliminação da complexidade de se implementar tudo dentro de Delégua.

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

Um exemplo de `configuracao.delegua` é o seguinte:

```js
liquido.roteador.cors = verdadeiro
liquido.roteador.bodyParser = verdadeiro
liquido.roteador.morgan = verdadeiro
liquido.roteador.cookieParser = verdadeiro
liquido.roteador.passport = verdadeiro
liquido.roteador.json = verdadeiro
liquido.roteador.helmet = verdadeiro
```

### Servindo arquivos estáticos

Uma aplicação em Liquido pode servir arquivos estáticos se o roteador tiver uma configuração de diretório correspondente. Por exemplo:

```js
liquido.roteador.diretorioEstatico = 'publico'
```

Ou seja, havendo um diretório `publico` na sua aplicação, é possível servir arquivos como imagens, CSS, JS e assim por diante. 

Se uma imagem com o nome `teste.png` é colocada dentro do diretório `publico`, ao iniciar sua aplicação em http://localhost:3000, a imagem pode ser acessada por http://localhost:3000/teste.png. 

#### Conversões automáticas para diretório estático

Ao inicializar, Liquido verifica um diretório `estilos`. Havendo arquivos FolEs nele (extensão `.foles`), cada arquivo é automaticamente convertido para CSS e salvo em um diretório dentro do diretório estático definido na configuração chamado `css`.

### Padrões de Aplicação

Liquido foi pensado para servir qualquer padrão de projeto para aplicações Web. A primeira versão de Liquido garante a implementação dos seguintes padrões:

- MVC (Modelo, Visão, Controle): padrão em três camadas em que o servidor normalmente devolve HTML;
- RESTful API: Padrão em que a aplicação funciona como um serviço não visual, normalmente retornando dados serializáveis como JSON e XML.

Futuras versões de Liquido terão:

- GraphQL
- gRPC

## Filosofia de Tradução para o Inglês

Liquido permite a qualquer desenvolvedor que saiba português a escrever aplicações Web, e possivelmente criar um ecossistema profissional a partir dele. Procuramos traduzir o máximo possível de informações e conceitos por uma questão de acessibilidade, mas há limites para isso. Por exemplo, não traduzimos os métodos de HTTP porque entendemos que uma tradução disso implicaria em um protocolo novo de transferência.

O que tentamos fazer é instigar os desenvolvedores a aprenderem inglês conforme vão dominando outros conceitos. Um aprendizado direcionado de inglês é muito mais eficiente do que o aprendizado pelo aprendizado.