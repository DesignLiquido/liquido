import { filtroPerformatico } from '../../infraestrutura/utilidades/filtro-performatico';

test('Testando função de filtro', () => {
    const lista = [1, 2, 3, 1, 2, 3, 1, 2, 1];
    const resultado = filtroPerformatico((e) => Number(e) === 1, lista);
    expect(resultado).toEqual([1, 1, 1, 1]);
});
