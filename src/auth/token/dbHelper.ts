import Logger from '../../utils/winstonConfig';
import { ITokenDocument, Token, Tokens } from './model';

export class DbTokenHelper {
    public static logger = new Logger('DbTokenHelper');
    public static createToken = async (newToken: ITokenDocument) => {
        const prefix = '[createToken]';
        try {
            const token = await newToken.save();
            if (token) { return { status: 200, token }; }
            return { status: 204 };
        } catch (err) {
            DbTokenHelper.logger.error(`${prefix} ${err.message}`, err.stack);
            return { status: 500, error: 'Failed to create a token' };
        }
    }
    public static fetchToken = async (findOptions: Token) => {
        const prefix = '[fetchTokenByToken]';
        try {
            const token = await Tokens.findOne(findOptions);
            if (token) { return { status: 200, token }; }
            return { status: 204 };
        } catch (err) {
            DbTokenHelper.logger.error(`${prefix} ${err.message}`, err.stack);
            return { status: 500, error: 'Failed to fetch token' };
        }
    }
}