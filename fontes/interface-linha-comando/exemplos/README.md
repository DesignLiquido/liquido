# Exemplos de projetos em Liquido

Neste diretório temos os tipos de projetos que Liquido pode gerar. Ao executar `liquido novo`, a interface deve pedir o tipo de projeto. Os tipos de projeto são:

- MVC: abreviação de modelo-visão-controlador. Neste tipo de projeto temos os modelos, que são descrições de entidades de dados, os controladores, que são camadas de construção e organização de estruturas de dados, execução de lógicas e tratamento de erros, e a visão, que é um conjunto de elementos de apresentação. Modelos e controlador são expressos em Delégua e LinConEs. A visão é expressa em LMHT e FolEs;
- API REST: Neste tipo de projeto temos uma interface de dados com o mundo externo, que alimenta outras aplicações. Cada requisição a cada um dos caminhos devolve uma resposta HTTP, com um código HTTP e o conteúdo da resposta. O conteúdo por padrão é serializado em JSON, mas qualquer outro formato serializável pode ser usado, como XML, HTML, YAML, TOML, CSV e assim por diante. 