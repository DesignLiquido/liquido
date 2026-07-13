import { Liquido } from '../fontes/liquido';

/**
 * Testes de regressão para o achado A1 (issue #100):
 * erros de runtime não podem chegar ao cliente como "[object Object]"
 * em text/plain, nem ao console como mensagens cruas em inglês com o
 * código genérico LIQ99999 sem localização.
 */
describe('Tratamento de erros de interpretação', () => {
    let liquido: Liquido;

    beforeEach(() => {
        liquido = new Liquido(process.cwd());
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    const erroInternoDeRuntime = () => ({
        erros: [
            {
                erroInterno: {
                    message: "Cannot read properties of undefined (reading 'name')",
                    pilha: 'pilha simulada'
                }
            }
        ]
    });

    describe('Arquétipo REST', () => {
        beforeEach(() => {
            (liquido as any).centroConfiguracoes = { liquido: { arquetipo: 'rest' } };
        });

        it('deve responder JSON estruturado, nunca "[object Object]"', () => {
            const resultado = (liquido as any).logicaComumErrosInterpretacao(erroInternoDeRuntime());

            expect(resultado.statusHttp).toBe(500);
            expect(resultado.tipoConteudo).toBe('JSON');
            expect(typeof resultado.corpoRetorno).toBe('object');
            expect(resultado.corpoRetorno.mensagem).toBe('Ocorreu um erro interno na aplicação.');
            expect(String(resultado.corpoRetorno)).not.toBe(resultado.corpoRetorno);
        });

        it('deve traduzir erros conhecidos do motor JavaScript para português com código próprio', () => {
            const resultado = (liquido as any).logicaComumErrosInterpretacao(erroInternoDeRuntime());
            const detalhes = resultado.corpoRetorno.detalhes.join('\n');

            expect(detalhes).toContain('LIQ20001');
            expect(detalhes).not.toContain('LIQ99999');
            expect(detalhes).toContain('Tentativa de acessar uma propriedade de um valor nulo ou indefinido.');
            // A mensagem original é preservada como detalhe técnico.
            expect(detalhes).toContain("Cannot read properties of undefined (reading 'name')");
        });

        it('deve apontar arquivo e linha do código do usuário quando disponíveis', () => {
            const erroComLocalizacao = {
                erros: [
                    {
                        linha: 7,
                        erroInterno: {
                            message: "Cannot read properties of undefined (reading 'name')",
                            pilha: 'pilha simulada'
                        }
                    }
                ]
            };

            const resultado = (liquido as any).logicaComumErrosInterpretacao(
                erroComLocalizacao,
                'rotas/usuarios/[id].pitu'
            );
            const detalhes = resultado.corpoRetorno.detalhes.join('\n');

            expect(detalhes).toContain('Arquivo: rotas/usuarios/[id].pitu');
            expect(detalhes).toContain('Linha: 7');
        });

        it('deve manter LIQ99999 apenas para erros ainda não mapeados', () => {
            const erroDesconhecido = {
                erros: [
                    {
                        erroInterno: {
                            message: 'some very unusual internal failure',
                            pilha: 'pilha simulada'
                        }
                    }
                ]
            };

            const resultado = (liquido as any).logicaComumErrosInterpretacao(erroDesconhecido);
            expect(resultado.corpoRetorno.detalhes.join('\n')).toContain('LIQ99999');
        });
    });

    describe('Arquétipo MVC', () => {
        beforeEach(() => {
            (liquido as any).centroConfiguracoes = { liquido: { arquetipo: 'mvc' } };
        });

        it('deve responder a página de erro com tipoConteudo HTML, nunca text/plain', () => {
            const resultado = (liquido as any).logicaComumErrosInterpretacao(erroInternoDeRuntime());

            expect(resultado.statusHttp).toBe(500);
            expect(resultado.tipoConteudo).toBe('HTML');
            expect(resultado.corpoRetorno).toContain('Erro de Execução - Líquido');
            expect(resultado.corpoRetorno).toContain('LIQ20001');
        });
    });

    describe('Arquétipo desconhecido ou ausente', () => {
        it('deve devolver JSON estruturado em vez de corpo indefinido', () => {
            (liquido as any).centroConfiguracoes = { liquido: { arquetipo: 'api-rest' } };

            const resultado = (liquido as any).logicaComumErrosInterpretacao(erroInternoDeRuntime());

            expect(resultado.statusHttp).toBe(500);
            expect(resultado.tipoConteudo).toBe('JSON');
            expect(resultado.corpoRetorno).toBeDefined();
            expect(resultado.corpoRetorno.mensagem).toBe('Ocorreu um erro interno na aplicação.');
        });
    });
});
