import { Document, model, Schema, Types } from 'mongoose';

export class Token {
    public _id?: Types.ObjectId;
    public _userId?: Types.ObjectId;
    public token?: string;
    public createdAt?: Date;
    constructor(data: {
        _userId?: Types.ObjectId
        token?: string,
    }) {
        this._userId = data._userId || undefined;
        this.token = data.token || undefined;
    }
}

const schema = new Schema({
    _userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    createdAt: {
        default: Date.now,
        expires: 43200, // 12hours 
        required: true,
        type: Date,
    },
    token: { type: String, required: true },
    type: {
        default: 'tokens',
        type: String,
    },
}, { collection: 'mykuopio_user_tokens' });

schema.set('toJSON', { virtuals: true });
schema.set('toObject', { virtuals: true });

const preFind = function () {
    this.find({ type: 'tokens' }).select({ type: 0, __v: 0 });
};
schema.pre('find', preFind);
schema.pre('findOne', preFind);

export interface ITokenDocument extends Token, Document {
    _id: Types.ObjectId;
}

export const Tokens = model<ITokenDocument>('Token', schema);