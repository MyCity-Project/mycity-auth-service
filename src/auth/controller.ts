import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import jwt from 'jwt-simple';
import moment from 'moment';
import shortid from 'shortid-36';
import { asyncMiddleware } from '../utils';
import Logger from '../utils/winstonConfig';
import { sendEmail } from './emailHelper';
import { DbTokenHelper, Token, Tokens } from './token';
import { User, Users } from './user';
import { DbUserHelper } from './user/dbHelper';

const JWT_SECRET = process.env.JWT_SECRET || 'temporarySecret';
export class AuthController {
    public loginPost = asyncMiddleware(async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const userResult = await DbUserHelper.fetchUser({ email: req.body.email });
        const { user, error, status } = userResult;
        if (error) {
            return res.status(status).send({ errors: [{ msg: error }] });
        }
        if (!user) { return res.status(401).send({ errors: [{ msg: 'Invalid email or password' }] }); }
        const isMatch = await user.comparePassword(req.body.password);
        if (!isMatch) { return res.status(401).send({ errors: [{ msg: 'Invalid email or password' }] }); }
        //if (!user.isVerified) { return res.status(401).send({ errors: [{ type: 'not-verified', msg: 'Your account has not been verified.' }] }); }
        const expires = moment().add(365, 'days').unix();
        res.send({ token: this.generateToken(user.email, user.roles), exp: expires, username: user.name, email: user.email, roles: user.roles });
    });

    public signupPost = asyncMiddleware(async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        const { email, password, role, name } = req.body;
        if (role) {
            // assigning user role could cause security problem
            return res.status(422).send({ errors: [{ msg: 'User role cannot be assigned while signing up' }] });
        }
        const userResult = await DbUserHelper.fetchUser({ email });
        let { user, error } = userResult;
        if (error) { return res.status(500).send({ errors: [{ msg: error }] }); }
        if (user) { return res.status(401).send({ errors: [{ msg: 'The email address is already registered' }] }); }

        /*if (!new RegExp('@nokia.com$', 'i').test(email) && !new RegExp('@levitezer.com$', 'i').test(email) && !new RegExp('@gmail.com$', 'i').test(email)) {
            return res.status(422).send({ errors: [{ msg: 'Only Nokia employees can register' }] });
        }*/
        const roles = [];
        if (role) { roles.push(role); }
        user = new Users({ email, password, roles, name });
        const createResult = await DbUserHelper.saveUser(user);
        error = createResult.error;
        if (error) { return res.status(500).send({ errors: [{ msg: error }] }); }
        user = createResult.user;

        let token = new Tokens({ _userId: user._id, token: shortid.generate() });
        const tokenResult = await DbTokenHelper.createToken(token);
        error = tokenResult.error;
        if (error) { return res.status(500).send({ errors: [{ msg: error }] }); }
        token = tokenResult.token;

        // const protocol = req.secure ? 'https' : 'http'
        // const targetUrl = `${protocol}://${req.headers.host}/confirmation?token=${token.token}`
        const sendResult = await this.sendTokenViaEmail(user.email, token.token);
        error = sendResult.error;
        if (error) { return res.status(500).send({ errors: [{ msg: error }] }); }

        res.status(200).send({ email: user.email, msg: `A verification email has been sent to ${user.email}.` });

    });
    public confirmationPost = asyncMiddleware(async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        const tokenResult = await DbTokenHelper.fetchToken({ token: req.body.token });
        let { error } = tokenResult;
        if (error) { return res.status(500).send({ errors: [{ msg: error }] }); }
        const { token } = tokenResult;
        if (!token) { return res.status(400).send({ errors: [{ type: 'not-verified', msg: 'We were unable to find a valid token. Your token may have expired.' }] }); }
        let userResult = await DbUserHelper.fetchUser({ _id: token._userId, email: req.body.email });
        error = userResult.error;
        if (error) { return res.status(500).send({ errors: [{ msg: error }] }); }
        const { user } = userResult;
        if (!user) { return res.status(400).send({ errors: [{ msg: 'We were unable to find a user for this token.' }] }); }
        if (user.isVerified) { return res.status(400).send({ errors: [{ type: 'already-verified', msg: 'This user has already been verified.' }] }); }
        user.isVerified = true;
        userResult = await DbUserHelper.saveUser(user);
        error = userResult.error;
        if (error) { return res.status(500).send({ errors: [{ msg: error }] }); }
        const expires = moment().add(365, 'days').unix();
        res.send({ token: this.generateToken(user.email, user.roles), exp: expires, username: user.name, email: user.email, roles: user.roles });
    });

    // automatically send user confirmation from link and go to my campus afterwards
    public autoConfirmation = asyncMiddleware(async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        const {token, email} = req.query;
        res.send(
            `
            <form name="myform" method="post" action="confirmation">
                <input type="hidden" name="token" value="${token}"/>
                <input type="hidden" name="email" value="${email}"/>
            </form>
            <script>document.myform.submit(); //window.location.replace("https://mycampus.karage.fi/");</script>
            `
        )
    });

    public resendTokenPost = asyncMiddleware(async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        const userResult = await DbUserHelper.fetchUser({ email: req.body.email });
        let { error } = userResult;
        if (error) { return res.status(500).send({ errors: [{ msg: error }] }); }
        const { user } = userResult;
        if (!user) { return res.status(400).send({ errors: [{ msg: 'We were unable to find a user with that email.' }] }); }
        if (user.isVerified) { return res.status(400).send({ errors: [{ type: 'already-verified', msg: 'This user has already been verified.' }] }); }

        let token = new Tokens({ _userId: user._id, token: shortid.generate() });
        const tokenResult = await DbTokenHelper.createToken(token);
        error = tokenResult.error;
        if (error) { return res.status(500).send({ errors: [{ msg: error }] }); }
        token = tokenResult.token;

        // const protocol = req.secure ? 'https' : 'http'
        // const targetUrl = `${protocol}://${req.headers.host}/confirmation?token=${token.token}`
        const sendResult = await this.sendTokenViaEmail(user.email, token.token);
        error = sendResult.error;
        if (error) { return res.status(500).send({ errors: [{ msg: error }] }); }

        res.status(200).send(`A verification email has been sent to ${user.email}.`);
    });
    public forgotPassword = asyncMiddleware(async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        const userResult = await DbUserHelper.fetchUser({ email: req.body.email });
        let { error } = userResult;
        if (error) { return res.status(500).send({ errors: [{ msg: error }] }); }
        const { user } = userResult;
        if (!user) { return res.status(400).send({ errors: [{ msg: 'We were unable to find a user with that email.' }] }); }
        const resetToken = shortid.generate();
        const tokenExpires = Date.now() + 43200000; // 12 hours from current time
        user.set({
            passwordResetExpires: tokenExpires,
            passwordResetToken: resetToken,
        }).save();
        const sendResult = await this.sendTokenViaEmail(user.email, resetToken);
        error = sendResult.error;
        if (error) { return res.status(500).send({ errors: [{ msg: error }] }); }

        res.status(200).send(`Reset token has been sent to ${user.email}.`);
    });
    public resetPassword = asyncMiddleware(async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        const { email, resetToken, password } = req.body;
        const userResult = await DbUserHelper.fetchUser({
            email,
            passwordResetExpires: { $gt: Date.now() },
            passwordResetToken: resetToken,
        });
        const { error } = userResult;
        if (error) { return res.status(500).send({ errors: [{ msg: error }] }); }
        const { user } = userResult;
        if (!user) { return res.status(400).send({ errors: [{ msg: 'We were unable to find a user with that email. Or the reset token has expired.' }] }); }
        user.set({ password }).save();
        res.status(200).send(`${user.email} has reset password.`);
    });
    private sendTokenViaEmail = async (to: User['email'], token: Token['token']) => {
        //Or click this <a href="https://mycampus-server.karage.fi/auth/econfirmation?token=${token}&email=${to}">link</a>
        try {
            console.log("sending email....");
            await sendEmail({
                from: 'no-reply@karage.fi',
                html: `
                <div style="text-align: center;">
                    <p>
                        To verify your account, please input the token in our <a href="https://mycampus.karage.fi/validate?email=${to}">website</a> login page within 12 hours.
                    </p>
                    <p>${token}</p>
                </div>
                `,
                subject: '[MyCampus] Account verification',
                to,
            });
            console.log("email sent...");
            return {};
        } catch (err) {
            new Logger('AuthController').error(err.message, err.stack);
            return { error: 'Failed to send verification email' };
        }
    }
    private generateToken = (email: User['email'], roles: User['roles']) => {
        const expires = moment().add(365, 'days').unix();
        return jwt.encode({ sub: email, exp: expires }, JWT_SECRET);
    }
}