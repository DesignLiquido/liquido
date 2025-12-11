# Testes de Middlewares - Liquido

Este documento descreve os testes criados para validar a funcionalidade de middlewares no framework Liquido.

## Arquivos Criados

### 1. `exemplos/rotas/middlewares.delegua`
Arquivo de exemplo contendo diferentes cenários de uso de middlewares:
- **Rota sem middleware**: Backward compatibility
- **Rota com um middleware**: Middleware que não para a cadeia
- **Rota com múltiplos middlewares**: Vários middlewares em sequência
- **Rota com middleware que para a cadeia**: Autenticação que retorna 401
- **Rota com mix de middlewares**: Combinação de middlewares nomeados e inline

### 2. `liquido.test.ts` (atualizado)
Adicionados testes para:
- Importação de arquivos com middlewares
- Processamento de rotas com diferentes quantidades de middlewares
- Resolução de caminhos de rotas com middlewares
- Métodos auxiliares e inicialização

### 3. `middlewares-integracao.test.ts` (novo)
Testes de integração abrangentes incluindo:
- Importação e parsing de rotas com middlewares
- Validação de estrutura do Liquido
- Descoberta recursiva de arquivos
- Resolução de caminhos
- Configuração
- Descoberta de estilos

## Como Executar os Testes

### Executar todos os testes
```bash
yarn testes
```

### Executar testes em modo watch
```bash
yarn testes:w
```

### Executar apenas testes de middlewares
```bash
yarn jest middlewares
```

### Executar testes com cobertura
```bash
yarn testes-unitarios
```

## Cenários de Teste Cobertos

### 1. Backward Compatibility
✅ Rotas sem middleware continuam funcionando normalmente

### 2. Middleware Único
✅ Middleware que não envia resposta permite continuação da cadeia
✅ Middleware que envia resposta para a cadeia

### 3. Múltiplos Middlewares
✅ Execução sequencial de middlewares
✅ Primeiro middleware que envia resposta para a cadeia
✅ Todos middlewares executam se nenhum enviar resposta

### 4. Resolução de Funções
✅ Referências a funções nomeadas são resolvidas corretamente
✅ Funções inline funcionam corretamente
✅ Mix de funções nomeadas e inline

### 5. Validação de Estrutura
✅ Roteador configurado corretamente
✅ Interpretador configurado corretamente
✅ Avaliador sintático configurado corretamente

## Estrutura dos Testes

```
testes/
├── testes-unitarios/
│   ├── exemplos/
│   │   └── rotas/
│   │       ├── inicial.delegua          # Rotas existentes
│   │       ├── middlewares.delegua      # Novo: rotas com middlewares
│   │       └── mvc/
│   │           └── inicial.delegua
│   ├── liquido.test.ts                  # Atualizado: testes de middlewares
│   └── middlewares-integracao.test.ts   # Novo: testes de integração
```

## Exemplos de Middlewares

### Middleware que Continua a Cadeia
```delegua
funcao logarRequisicao(requisicao, resposta) {
    escreva("Middleware: Requisição recebida")
    // Não envia resposta - continua para próximo middleware
}
```

### Middleware que Para a Cadeia
```delegua
funcao autenticar(requisicao, resposta) {
    se (requisicao.parametrosPesquisa.token == "invalido") {
        retorna resposta.enviar("Não autorizado").status(401)
        // Envia resposta - para a cadeia aqui
    }
    // Se não enviar resposta, continua
}
```

### Uso em Rotas
```delegua
// Com um middleware
liquido.rotaPost(logarRequisicao, funcao(requisicao, resposta) {
    resposta.enviar("Com um middleware").status(200)
})

// Com múltiplos middlewares
liquido.rotaPut(logarRequisicao, autenticar, funcao(requisicao, resposta) {
    resposta.enviar("Rota protegida").status(200)
})
```

## Verificação de Cobertura

Após executar os testes com cobertura, verifique:
- `liquido.ts`: Deve ter alta cobertura nas funções de middleware
- `adicionarRota`: Testado com diferentes quantidades de argumentos
- `executarFuncaoRota`: Testado através de integração
- `respostaFoiDefinida`: Testado através de integração

## Próximos Passos

Para testes mais avançados, considere:
1. Testes E2E com servidor Express real
2. Testes de performance com muitos middlewares
3. Testes de erro (middlewares que lançam exceções)
4. Testes de middlewares assíncronos
