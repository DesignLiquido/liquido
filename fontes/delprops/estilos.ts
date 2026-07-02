import { DefinicaoPropriedade } from '@designliquido/delprops';

/**
 * Propriedades de configuração de estilos do Líquido (`liquido.estilos.*`).
 */
const estilos: DefinicaoPropriedade[] = [
    {
        nome: 'diretorioBase',
        tipo: 'texto',
        detalhe: "Caminho do diretório onde o CSS gerado a partir de FolEs é salvo e servido (padrão: 'publico/css').",
    },
];

export default estilos;
