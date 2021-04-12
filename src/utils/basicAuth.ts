import express from 'express';
import basicAuth from 'express-basic-auth';

export class BasicAuth {
    public static basicAuth: express.RequestHandler = basicAuth({
        challenge: true,
        users: {
            [process.env.BASIC_USERNAME || 'admin']: process.env.BASIC_PASSWORD || 'password',
        },
    });
    public static sodexoAuth: express.RequestHandler = basicAuth({
        challenge: true,
        users: {
            [process.env.SODEXO_USERNAME || 'sodexo']: process.env.SODEXO_PASSWORD || 'password',
        },
    });
}