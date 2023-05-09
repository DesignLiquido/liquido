import passport from 'passport';
import passportJWT from 'passport-jwt';
import express from 'express';

import users from '../../usuarios';
import { devolverVariavelAmbiente } from './variaveis-ambiente';

const { Strategy, ExtractJwt } = passportJWT;

type TipoAutenticacao = {
    initialize: () => express.Handler;
    authenticate: () => any;
};

const autenticacao = (): TipoAutenticacao => {
    const parametros = {
        secretOrKey: devolverVariavelAmbiente('chaveSecreta') as string,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
    };

    const estrategia = new Strategy(parametros, (payload, done) => {
        const usuario = users[payload.id] || null;
        if (usuario) {
            return done(null, {
                id: usuario.id
            });
        } else {
            return done(new Error(`Usuário não encontrado.`), null);
        }
    });
    passport.use(estrategia);
    return {
        initialize: function () {
            return passport.initialize();
        },
        authenticate: function () {
            return passport.authenticate('jwt', { session: devolverVariavelAmbiente('session') as boolean });
        }
    };
};

export default autenticacao;
