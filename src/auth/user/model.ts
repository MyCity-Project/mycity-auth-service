import bcrypt from 'bcrypt';
import { Document, model, Schema, Types } from 'mongoose';
import Logger from '../../utils/winstonConfig';
export class User {
    public _id?: Types.ObjectId;
    public email?: string;
    public name?: string;
    public roles?: string[];
    public isVerified?: boolean;
    public password?: string;
    public passwordResetToken?: string;
    public passwordResetExpires?: Date;
    constructor(
        data: {
            email?: string
            name?: string
            roles?: string[]
            isVerified?: boolean
            password?: string
            passwordResetToken?: string
            passwordResetExpires?: Date,
        },
    ) {
        this.email = data.email || undefined;
        this.name = data.name || undefined;
        this.roles = data.roles || undefined;
        this.isVerified = data.isVerified || false;
        this.password = data.password || undefined;
        this.passwordResetToken = data.passwordResetToken || undefined;
        this.passwordResetExpires = data.passwordResetExpires || undefined;
    }
}
const schema = new Schema<IUserDocument>({
    email: { type: String },
    isVerified: { default: false, type: Boolean },
    name: String,
    password: String,
    passwordResetExpires: Date,
    passwordResetToken: String,
    roles: [{ type: String }],
    type: { default: 'users', type: String },
}, { collection: 'mykuopio_users' });

schema.set('toJSON', { virtuals: true });
schema.set('toObject', { virtuals: true });

const preFind = async function () {
    this.find({ type: 'users' })
        .select({ type: 0, __v: 0 });
};
schema.pre('find', preFind);
schema.pre('findOne', preFind);

schema.pre('save', async function (next) {
    const user = this as IUserDocument;
    if (!user.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(user.password, salt);
        user.password = hash;
    } catch (err) {
        new Logger('User Model').error(`Error while encrypting password: ${err.message}`, err.stack);
        return next(err);
    }
});
schema.methods.comparePassword = async function (candidatePassword) {
    try {
        const isMatch = await bcrypt.compare(candidatePassword, this.password);
        return Promise.resolve(isMatch);
    } catch (err) {
        new Logger('User Model').error(`Error while matching password: ${err.message}`, err.stack);
    }
};
export interface IUserDocument extends User, Document {
    _id: Types.ObjectId;
    comparePassword: (inputPassword) => Promise<boolean>;
}

export const Users = model<IUserDocument>('User', schema);
// Users.collection.createIndex({ type: 1, email: 1 },
//     {
//         partialFilterExpression: {
//             type: 'users',
//         },
//         unique: true,
//     });