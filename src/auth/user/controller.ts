import { Request, Response } from 'express';
import { asyncMiddleware } from '../../utils';
import { DbUserHelper } from './dbHelper';
export class UserController {
    public getUsers = asyncMiddleware(async (req: Request, res: Response) => {
        const findOptions = {};
        const options = req.body;
        Object.assign(findOptions, options);
        const { error, status, users } = await DbUserHelper.fetchUsers(findOptions);
        if (error) { return res.status(status).send({ errors: [{ msg: error }] }); }
        res.send(users);
    });
    public putUser = asyncMiddleware(async (req: Request, res: Response) => {
        const updateOptions = {};
        const { _id } = req.params;
        const options = req.body;
        Object.assign(updateOptions, options);
        const { error, status, user } = await DbUserHelper.updateUser(_id, updateOptions);
        if (error) { return res.status(status).send({ errors: [{ msg: error }] }); }
        res.send(user);
    });
    public deleteUser = asyncMiddleware(async (req: Request, res: Response) => {
        const { _id } = req.params;
        const { error, status, user } = await DbUserHelper.deleteUser(_id);
        if (error) { return res.status(status).send({ errors: [{ msg: error }] }); }
        res.send(user);
    });
}