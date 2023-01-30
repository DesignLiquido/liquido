import passport from "passport"
import passportJWT from 'passport-jwt'
import e from "express"
import users from "../../usuarios"
import { devolveVariavelAmbiente } from './devolve-variavel-ambiente'

const { Strategy, ExtractJwt } = passportJWT
const params = {
    secretOrKey: devolveVariavelAmbiente('chaveSecreta') as string,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
}

type AutenticacaoType = {
    initialize: () => e.Handler;
    authenticate: () => any;
}

const autenticacao = (): AutenticacaoType => {

    const estrategia = new Strategy(params, (payload, done) => {
        const user = users[payload.id] || null;
        if (user) {
            return done(null, {
                id: user.id
            })
        } else {
            return done(new Error(`User not found`), null)
        }
    })
    passport.use(estrategia);
    return {
        initialize: function () {
            return passport.initialize();
        },
        authenticate: function () {
            return passport.authenticate("jwt", { session: devolveVariavelAmbiente('session') as boolean });
        }
    }
}

export default autenticacao