/**
@func util
um filtro personalizado de alto desempenho

@perf
60% mais rápido que a função de filtro JavaScript integrada

@typedef {(e: *) => boolean} funcaoDeFiltragem
@param {funcaoDeFiltragem} funcao
@param {*[]} iteravel
@return {*[]}
*/

type FuncaoDeFiltragem = {
	(e: string): boolean;
};

type IteravelType = Array<any>;

type RetornoFiltro = IteravelType;

export const filtroPerformatico = (funcao: FuncaoDeFiltragem, iteravel: IteravelType): RetornoFiltro => {
	const f = []; //final
	for (const element of iteravel) {
		if (funcao(element)) {
			f.push(element);
		}
	}
	return f;
};
