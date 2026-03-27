import { verificarXml } from './verificar-xml';


describe('verificarXml', () => {
    it('deve retornar true para um xml válido', async () => {
        const xml = '<xml></xml>';
        const resultado = await verificarXml(xml);
        expect(resultado).toBeTruthy();
    });

    it('deve retornar false para um xml inválido', async () => {
        const xml = '<xml>';
        await expect(verificarXml(xml)).rejects.toBeInstanceOf(Error);
    });
});
