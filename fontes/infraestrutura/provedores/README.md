# Provedores

São classes que resolvem uma determinada configuração do ambiente (normalmente provida em `configuracao.delegua`). Por exemplo, se a configuração irá usar LinConEs para acesso a bancos de dados, a classe `ProvedorLincones` fará toda a configuração da instância de LinConEs com a tecnologia selecionada na configuração. O retorno é um objeto que Delégua consegue trabalhar.