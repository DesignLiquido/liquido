# Descrição
Esta PR tem como objetivo permitir a configuração da porta do roteador através do arquivo de configuração, em vez de depender apenas da variável de ambiente `PORT`. Isso proporciona maior flexibilidade na definição da porta de execução do roteador, permitindo que seja configurada diretamente no código, caso necessário.
## Alterações
- Adicionado o campo `porta` e o método `configurarPorta` no arquivo `fontes\liquido\roteador.ts`
- Adicionado o campo `porta` no arquivo `fontes\delprops\roteador.ts`
- Testes atualizados para refletir a nova forma de configuração da porta.
- Arquivo `configuracao.delprops` atualizado para incluir a propriedade `porta`.
- Interface `fontes\interfaces\roteador-interface.ts` atualizada para incluir a propriedade `porta`.

## Ganhos
Com essa alteração, será possível configurar a porta do roteador diretamente no arquivo de configuração, permitindo maior flexibilidade e personalização do ambiente de execução. Vale ressaltar o padrão da porta continua sendo 3000, caso a propriedade `porta` não seja definida no arquivo de configuração.

É necessário aprovar a PR https://github.com/DesignLiquido/delprops/pull/1 para que a propriedade `porta` seja reconhecida corretamente no arquivo de configuração.
