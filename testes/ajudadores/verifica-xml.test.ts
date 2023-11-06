import * as xmlParser from 'fast-xml-parser';
import { VerificaXml } from './verifica-xml';


describe('VerificaXml', () => {
    it('deve retornar true para um xml válido', async () => {
        const xml = '<xml></xml>'
        const resultado = VerificaXml(xml)
        expect(resultado).toBeTruthy()
    })
    it('deve retornar false para um xml inválido', async () => {
        const xml = '<xml>'
        const resultado = VerificaXml(xml)
        expect(resultado instanceof Object).toBeTruthy()
        expect((resultado as xmlParser.ValidationError).err.code).toEqual('InvalidTag')
    })
})