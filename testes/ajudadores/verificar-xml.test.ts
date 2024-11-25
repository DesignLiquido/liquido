import { verificarXml } from './verificar-xml';


describe('verificarXml', () => {
    it('deve retornar true para um xml válido', async () => {
        const xml = '<xml></xml>';
        const resultado = await verificarXml(xml);
        expect(resultado).toBeTruthy();
    });

    it.skip('deve retornar false para um xml inválido', async () => {
        const xml = '<xml>';
        const resultado = await verificarXml(xml);
        expect(resultado instanceof Object).toBeTruthy();
        // expect((resultado as xmlParser.ValidationError).err.code).toEqual('InvalidTag')
    });
});
