# MVC

Este padrão de projeto implementa o que chamamos de MVC (Model-View-Controller, ou Modelo-Visão-Controlador), uma arquitetura em 3 camadas para _sites_, ou sítios, da internet.

## Não li e nem lerei

Se você não tem paciência para ler o documento inteiro, colocamos em cada diretório o mínimo que uma aplicação MVC em Líquido precisa ter. Fique à vontade para explorar cada diretório, que também possui um arquivo `LEIAME.md` correspondente.

Se tem, boa leitura.

## Arquiteturas em 3 Camadas e o MVC

Aplicações que consomem dados de fontes de dados independentes normalmente são implementadas em pelo menos duas camadas:

- Cliente: uma camada com uma interface, em que o usuário pode realizar operações com dados;
- Servidor: uma camada que possui os dados, retornando-os de acordo com a operação pedida pelo cliente.

Se trabalhamos com mais de um servidor, seja pela natureza dos dados, seja por como esses servidores se dispoõem materialmente, é comum separarmos o servidor em duas camadas independentes, obtendo, assim, três camadas:

- Cliente (ou Apresentação)
- Negócio
- Dados

Essa arquitetura ainda é muito utilizada até hoje, não importando a idade da aplicação. A camada de dados sabe como acessar os dados; a camada de negócio pede diferentes dados para diferentes pontos de entrada na camada de dados; esses dados são organizados e enviados para a camada de cliente (ou camada de apresentação), exibindo os dados ao usuário.

O MVC é uma especialização dessa arquitetura de três camadas, repensadas da seguinte forma:

- A camada de dados, ao invés de descrever detalhadamente como obter e retornar os dados, descreve entidades e seus relacionamentos em alto nível. Cada entidade dessa camada é chamada de Modelo, e o conjunto de modelos também é um Modelo;
- A camada de negócio trabalha com um mapeador objeto-relacional, ou um repositório de dados, dependendo das tecnologias dos bancos de dados. Mapeadores objeto-relacional e repositórios sabem ler as definições do Modelo, não apenas lendo e alterando dados, mas também controlando o esquema de dados. O esquema de dados é a materialização dos descritivos de entidades e seus relacionamentos. Em outras palavras, esses dois componentes sabem criar tabelas e coleções, bem como alterá-las e até removê-las. Cada componente desta camada é chamado de Controlador, que é o mesmo nome da camada: Controlador;
- A camada cliente, ou de apresentação, passa a ter diferentes formas de apresentar os dados, obedecendo a critérios como o tipo do requisitor, quais tipos de dados o requisitor aceita, e capacidades adicionais de apresentação dos dados pelo requisitor. Por exemplo, nossa aplicação pode responder a determinadas requisições como HTML, e outras como JSON. Cada documento que descreve essa apresentação de dados é chamado de Visão, que é o mesmo nome do conjunto de visões como camada: Visão.
