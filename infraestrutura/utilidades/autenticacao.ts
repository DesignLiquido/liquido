// modelo de users
import passport from "passport"
import passportJWT from 'passport-jwt'
import config from '../../config'
import e from "express"

const { Strategy, ExtractJwt } = passportJWT
const params = {
    secretOrKey: config.jwtSecret,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
}

type AutenticacaoType = {
    initialize: () => e.Handler;
    authenticate: () => any;
}

const autenticacao = (): AutenticacaoType => {
    const estrategia = new Strategy(params, (payload, done) => {
        // aqui vai a lógica de autenticação

        // exemplo de lógica de autenticação

        // var user = users[payload.id] || null;
        // if (user) {
        //     return done(null, {
        //         id: user.id
        //     });
        // } else {
        //     return done(new Error("User not found"), null);
        // }
    })
    passport.use(estrategia);
    return {
        initialize: function() {
            return passport.initialize();
        },
        authenticate: function() {
            return passport.authenticate("jwt", config.jwtSession);
        }
    }
}

export default autenticacao