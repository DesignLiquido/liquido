# Diretório `rotas`

Neste diretório temos uma série de controladores que implementam uma ou mais rotas. Uma rota é um endereço da internet, como por exemplo `http://localhost:3000`, `http://localhost:3000/blog`, `http://localhost:3000/blog/meu-primeiro-artigo`, e assim por diante. Rotas normalmente funcionam com métodos, como GET, POST, PUT e DELETE, e implementadas em Delégua. 

Rotas seguem uma convenção de diretórios. Por exemplo, se queremos implementar uma rota que responda em `http://localhost:3000` (ou seja, a rota raiz), devemos criar neste diretório um arquivo com o nome `inicial.delegua`. Um exemplo de arquivo inicial contém o seguinte:

```js
liquido.rotaGet(funcao(requisicao, resposta) {
  resposta.enviar("Olá mundo").status(200)
})
```

Se executarmos Liquido em modo servidor e tentarmos acessar `http://localhost:3000` no nosso navegador, se tudo foi feito da maneira certa, teremos uma página com o texto "Olá mundo". 

Seguindo os exemplos dados, se quisermos implementar `http://localhost:3000/blog`, temos duas boas opções:

- Criar dentro de `rotas` um diretório `blog`, e dentro desse diretório blog um arquivo `inicial.delegua`, com pelo menos uma configuração de rota dentro;
- Criar dentro de `rotas` um arquivo `blog.delegua`, com pelo menos uma configuração de rota dentro.