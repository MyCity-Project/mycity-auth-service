import { IUserDocument, User, Users } from '.';
import Logger from '../../utils/winstonConfig';

export class DbUserHelper {
    public static logger = new Logger('DbUserHelper');
    public static fetchUser = async (findOptions: any) => {
        const prefix = '[fetchUserByEmail]';
        try {
            const user = await Users.findOne(findOptions);
            if (user) { return { status: 200, user }; }
            return { status: 204 };
        } catch (err) {
            DbUserHelper.logger.error(`${prefix} ${err.message}`, err.stack);
            return { status: 500, error: 'Failed to fetch user by email' };
        }
    }
    public static fetchUsers = async (findOptions: User) => {
        const prefix = '[fetchUsers]';
        try {
            const users = await Users.find(findOptions);
            return { status: 200, users };
        } catch (err) {
            DbUserHelper.logger.error(`${prefix} ${err.message}`, err.stack);
            return { status: 500, error: 'Failed to fetch users' };
        }
    }
    public static updateUser = async (id: User['_id'], updateOptions: User) => {
        const prefix = '[updateUser]';
        try {
            const user = await Users.findById(id);
            if (!user) { return { status: 204 }; }
            user.set(updateOptions).save();
            return { status: 200, user };
        } catch (err) {
            DbUserHelper.logger.error(`${prefix} ${err.message}`, err.stack);
            return { status: 500, error: 'Failed to update user' };
        }
    }
    public static deleteUser = async (id: User['_id']) => {
        const prefix = '[updateUser]';
        try {
            const user = await Users.findByIdAndRemove(id);
            if (!user) { return { status: 204 }; }
            return { status: 200, user };
        } catch (err) {
            DbUserHelper.logger.error(`${prefix} ${err.message}`, err.stack);
            return { status: 500, error: 'Failed to delete user' };
        }
    }
    public static saveUser = async (newUser: IUserDocument) => {
        const prefix = '[saveUser]';
        try {
            const user = await newUser.save();
            if (user) { return { status: 200, user }; }
            return { status: 204 };
        } catch (err) {
            DbUserHelper.logger.error(`${prefix} ${err.message}`, err.stack);
            return { status: 500, error: 'Failed to save a user' };
        }
    }
}