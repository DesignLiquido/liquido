let capturedVerify: Function;

jest.mock('passport-jwt', () => {
    const { ExtractJwt } = jest.requireActual('passport-jwt');
    return {
        Strategy: jest.fn().mockImplementation((params, verify) => {
            capturedVerify = verify;
            return { name: 'jwt' };
        }),
        ExtractJwt
    };
});

jest.mock('passport', () => ({
    use: jest.fn(),
    initialize: jest.fn().mockReturnValue(jest.fn()),
    authenticate: jest.fn().mockReturnValue(jest.fn())
}));

import Autenticacao from '../../infraestrutura/utilidades/autenticacao';

describe('Autenticação - callback JWT', () => {
    const ANTIGO_AMBIENTE = process.env;

    beforeAll(() => {
        process.env = { ...ANTIGO_AMBIENTE, chaveSecreta: '123' };
        Autenticacao();
    });

    afterAll(() => {
        process.env = ANTIGO_AMBIENTE;
    });

    it('deve chamar done com o usuário quando o usuário existe', () => {
        const done = jest.fn();
        capturedVerify({ id: 0 }, done);
        expect(done).toHaveBeenCalledWith(null, expect.objectContaining({ id: expect.anything() }));
    });

    it('deve chamar done com erro quando o usuário não existe', () => {
        const done = jest.fn();
        capturedVerify({ id: 9999 }, done);
        expect(done).toHaveBeenCalledWith(expect.any(Error), null);
    });
});
