import { Router } from 'express';
import { check, param, sanitize, query } from 'express-validator';
import { AuthController } from './controller';
import { Passport } from './passport';
import { UserController } from './user';

export class AuthRoutes {
    public controller: AuthController = new AuthController();
    public userController: UserController = new UserController();
    public router: Router = Router();
    private passport: Passport = new Passport();
    constructor() {
        this.initializeRoutes();
    }
    public initializeRoutes = (): void => {
       

        this.router.post('/reset_password', [
            check('email', 'Email cannot be blank').not().isEmpty(),
            check('password', 'Password cannot be blank').not().isEmpty(),
            check('resetToken', 'Reset token cannot be blank').not().isEmpty(),
            sanitize('email').normalizeEmail({ gmail_remove_dots: false }),
        ], this.controller.resetPassword);
        /*
        this.router.post('/confirmation', [
            check('email', 'Email is not valid').isEmail(),
            check('email', 'Email cannot be blank').not().isEmpty(),
            check('token', 'Token cannot be blank').not().isEmpty(),
            sanitize('email').normalizeEmail({ gmail_remove_dots: false }),
        ], this.controller.confirmationPost);

        
        // email auto confirmation link
        this.router.get('/econfirmation', [
            query('token', 'I need the token').not().isEmpty(),
            query('email', 'I need the email').not().isEmpty(),
        ], this.controller.autoConfirmation);

        this.router.post('/forgot_password', [
            check('email', 'Email is not valid').isEmail(),
            check('email', 'Email cannot be blank').not().isEmpty(),
            sanitize('email').normalizeEmail({ gmail_remove_dots: false }),
        ], this.controller.forgotPassword);

        this.router.post('/resend', [
            check('email', 'Email is not valid').isEmail(),
            check('email', 'Email cannot be blank').not().isEmpty(),
            sanitize('email').normalizeEmail({ gmail_remove_dots: false }),
        ], this.controller.resendTokenPost);
        */

        this.router.post('/login', [
            check('email', 'Email is not valid').isEmail(),
            check('email', 'Email cannot be blank').not().isEmpty(),
            check('password', 'Password cannot be blank').not().isEmpty(),
            sanitize('email').normalizeEmail({ gmail_remove_dots: false }),

        ], this.controller.loginPost);
        this.router.post('/signup', [
            check('name', 'Name cannot be blank').not().isEmpty(),
            check('name', 'Name must be between 2 and 20 characters long').isLength({ min: 2, max: 20 }),
            check('email', 'Email is not valid').isEmail(),
            check('email', 'Email cannot be blank').not().isEmpty(),
            check('password', 'Password must be at least 5 characters long').isLength({ min: 5 }),
            sanitize('email').normalizeEmail({ gmail_remove_dots: false }),
        ], this.controller.signupPost);

        this.router.route('/users').get(
            //this.passport.requireAdmin,
            this.userController.getUsers,
        );
        this.router.route('/user/:_id').put([
            param('_id', 'user id cannot be blank').not().isEmpty(),
        ],
            //this.passport.requireAdmin,
            this.userController.putUser,
        )
            .delete([
                param('_id', 'user id cannot be blank').not().isEmpty(),
            ],
                //this.passport.requireAdmin,
                this.userController.deleteUser,
            );
        this.router.route('/verify').get(
                this.passport.requireUser,
                this.controller.verifyUser,
        );
    }
}