# Diretório `rotas`

Neste diretório temos uma série de controladores que implementam uma ou mais rotas. Uma rota é um endereço da internet, como por exemplo `http://localhost:3000`, `http://localhost:3000/blog`, `http://localhost:3000/blog/meu-primeiro-artigo`, e assim por diante. Rotas normalmente funcionam com métodos, como GET, POST, PUT e DELETE, e implementadas em Pituguês.

Rotas seguem uma convenção de diretórios. Por exemplo, se queremos implementar uma rota que responda em `http://localhost:3000` (ou seja, a rota raiz), devemos criar neste diretório um arquivo com o nome `inicial.pitu`. Um exemplo de arquivo inicial contém o seguinte:

```js
@liquido.rotaGet("/")
funcao minha_rota(requisicao, resposta):
    resposta.enviar("Olá mundo").status(200)
```

Se executarmos Liquido em modo servidor e tentarmos acessar `http://localhost:3000` no nosso navegador, se tudo foi feito da maneira certa, teremos uma página com o texto "Olá mundo".

Seguindo os exemplos dados, se quisermos implementar `http://localhost:3000/blog`, temos duas boas opções:

- Criar dentro de `rotas` um diretório `blog`, e dentro desse diretório blog um arquivo `inicial.pitu`, com pelo menos uma configuração de rota dentro;
- Criar dentro de `rotas` um arquivo `blog.pitu`, com pelo menos uma configuração de rota dentro.

## Parametrização de rotas

Rotas podem trabalhar com múltiplos parâmetros, seja como parte do caminho, seja como parâmetro de pesquisa. A diferença entre parâmetros de caminho e parâmetros de pesquisa é a localização deles no endereço:

- Parâmetros de caminho ficam antes de um ponto de interrogação de um endereço;
- Parâmetros de pesquisa ficam após este ponto de interrogação do endereço.

Por exemplo, na rota `https://localhost:3000/blog/categorias/1/pesquisar?titulo=Programação`, temos um parâmetro de caminho (o número `1` entre `/categorias/` e `/pesquisar/`) e um parâmetro de pesquisa (no caso, nome `titulo` e valor `Programação`).

Em Líquido, a convenção de diretórios de rotas pode determinar a localização de parâmetros de caminho. Para termos uma rota que responde ao endereço de exemplo, precisamos ter:

- Dentro do diretório `rotas`, um diretório `blog`;
- Dentro do diretório `blog`, um diretório `categorias`;
- Dentro do diretório `categorias`, um diretório cujo nome começa e termina em colchetes. Por exemplo, `[id]`. Neste caso, ao acessar o endereço, Líquido automaticamente cria dentro da função da rota um parâmetro de caminho com o nome `id` e o valor deverá ser `1`;
- Dentro do diretório `[id]`, ou um arquivo `pesquisar.pitu`, ou um diretório pesquisar com um arquivo `inicial.pitu`.

Ou seja:

```
- rotas
  - blog
    - categorias
      - [id]
        - pesquisar.pitu
```

Ou:

```
- rotas
  - blog
    - categorias
      - [id]
        - pesquisar
          - inicial.pitu
```