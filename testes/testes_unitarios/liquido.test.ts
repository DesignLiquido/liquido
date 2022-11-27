import { Liquido } from '../../liquido';
import * as caminho from 'path';
import { RetornoMiddleware } from '../../interfaces';

describe('Liquido', () => {
	let liquido: Liquido;

	beforeEach(() => {
		liquido = new Liquido();
	});

	it('Testando descobrirRotas()', () => {
		liquido.descobrirRotas(caminho.join(__dirname, 'exemplos/rotas'));
		const rota1 = liquido.arquivosDelegua[0].split('rotas')[1];
		const rota2 = liquido.arquivosDelegua[1].split('rotas')[1];
		expect(liquido.arquivosDelegua).toHaveLength(2);
		expect(rota1).toBe('\\inicial.delegua');
		expect(rota2).toBe('\\mvc\\inicial.delegua');
	});

	it('Testando resolverCaminhoRota()', () => {
		const expected: string[] = [];

		liquido.descobrirRotas(caminho.join(__dirname, 'exemplos', 'rotas'));

		liquido.arquivosDelegua.forEach((arquivo) => {
			expected.push(liquido.resolverCaminhoRota(arquivo));
		});

		expect(expected).toHaveLength(2);
		expect(expected[0]).toBe('');
		expect(expected[1]).toBe('/mvc');
	});

	it('Testando resolveArquivoConfiguracaoMiddleware()', () => {
		const retorno: RetornoMiddleware = liquido.resolveArquivoConfiguracaoMiddleware(
			caminho.join(__dirname, 'exemplos')
		);

		expect(retorno.valor).toBeTruthy();
		expect(retorno.caminho).toBe(caminho.join(__dirname, 'exemplos', 'configuracao.delegua'));
	});
});
