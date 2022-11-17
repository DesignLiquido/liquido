# Liquido

Conjunto de ferramentas para desenvolvimento de aplicações para a internet 100% em português.

## Motivação

- [Delégua](https://github.com/DesignLiquido/delegua) é uma linguagem de programação 100% em português;
- [LMHT](https://github.com/DesignLiquido/LMHT) é uma linguagem de marcação 100% em português, feita para estruturar páginas de internet;
- [FolEs](https://github.com/DesignLiquido/FolEs) é uma linguagem para folhas de estilo, que estilizam páginas de internet. 

Liquido é um ferramentário que combina as três linguagens para ser possível desenvolver para a internet 100% em português.

## Inspiração

A maior inspiração deste projeto é a [FastAPI](https://fastapi.tiangolo.com/), mas também há influência do [Next.js](https://nextjs.org/). 

## Arquitetura

Para uma implementação inicial, foram escolhidas bibliotecas consagradas do Node.js para desenvolvimento para a Internet:

- [Express](https://www.npmjs.com/package/express)
- [Nodemon](https://nodemon.io/)

Liquido instancia os três componentes básicos de Delégua e os controla, instrumentando instruções escritas em Delégua para JavaScript puro.

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