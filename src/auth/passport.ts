import { NextFunction, Request, Response } from 'express';
import moment = require('moment');
import passport from 'passport';
import { ExtractJwt, Strategy as JwtStrategy, StrategyOptions } from 'passport-jwt';
import { IStrategyOptions, Strategy as LocalStrategy } from 'passport-local';
import { asyncMiddleware } from '../utils';
import Logger from '../utils/winstonConfig';
import { IUserDocument, User, Users } from './user';
const LOCAL_RULE = 'local-rule';
const USER_RULE = 'user-rule';
const ADMIN_RULE = 'admin-rule';
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    JWT_SECRET = 'temporarySecret';
    new Logger('Auth').debug('using temporary secret');
}
export class Passport {
    public static logger = new Logger('Authorization');
    private static localOptions: IStrategyOptions = {
        passwordField: 'password',
        usernameField: 'email',
    };
    private static localLogin = new LocalStrategy(Passport.localOptions, async (email, password, done) => {
        let user: IUserDocument;
        try {
            user = await Users.findOne({ email });
            if (!user) { return done(null, false, { message: `${email} is not registered.` }); }
            if (!user.isVerified) { return done(null, false, { message: `${email} is not verified.` }); }
        } catch (err) {
            return done(err);
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) { return done(null, false, { message: 'Invalid email or password.' }); }

        return done(null, user);
    });

    private static jwtOptions: StrategyOptions = {
        jwtFromRequest: ExtractJwt.fromHeader('authorization'),
        secretOrKey: JWT_SECRET,
    };

    private static jwtUserLogin = new JwtStrategy(Passport.jwtOptions, async (payload, done) => {
        let user: IUserDocument;
        try {
            user = await Users.findOne().where('email').equals(payload.sub);
            if (!user) { return done(null, false, { message: `${payload.sub} is not registered.` }); }
            if (!user.isVerified) { return done(null, false, { message: `${payload.sub} is not verified.` }); }
        } catch (err) {
            return done(err);
        }
        if (payload.exp <= moment().unix()) {
            done(null, false);
        } else {
            done(null, user);
        }
    });

    private static jwtAdminLogin = new JwtStrategy(Passport.jwtOptions, async (payload, done) => {
        let admin: IUserDocument;
        try {
            admin = await Users.findOne().where('email').equals(payload.sub)
                .where('roles').in(['admin']);
        } catch (err) {
            return done(err);
        }
        if (!admin) { return done(null, false, { message: `The user does not have any permission to access.` }); }
        if (!admin.isVerified) { return done(null, false, { message: `${payload.sub} is not verified.` }); }
        if (!admin || payload.exp <= moment().unix()) {
            done(null, false, { message: 'Token has been expired.' });
        } else {
            done(null, admin);
        }
    });
    private static authenticate = (rule: string) =>
        asyncMiddleware((req: Request, res: Response, next: NextFunction) =>
            passport.authenticate(rule, { session: false }, (err: Error, user: User, info: { message: string }) => {
                if (err) {
                    Passport.logger.error(err.message, err.stack);
                    return res.status(500).send({errors:[{msg:err.message}]});
                }

                if (!user) {
                    return res.status(401).send({
                        errors: info ? [{msg:info.message}] : 'Unauthorized',
                    });
                }
                next();
            })(req, res, next),
        )

    public requireLocal = Passport.authenticate(LOCAL_RULE);
    public requireUser = Passport.authenticate(USER_RULE);
    public requireAdmin = Passport.authenticate(ADMIN_RULE);
    constructor() {
        passport.use(LOCAL_RULE, Passport.localLogin);
        passport.use(USER_RULE, Passport.jwtUserLogin);
        passport.use(ADMIN_RULE, Passport.jwtAdminLogin);
    }
}