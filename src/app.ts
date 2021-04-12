import * as bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import * as http from 'http';
import mongoose from 'mongoose';
import morgan from 'morgan';
import * as path from 'path';

const env_path = path.join(__dirname, '..', '.env');
dotenv.config({ path: env_path });

import moment = require('moment-timezone');
import { AuthRoutes } from './auth';
import { WsController } from './utils';
import Logger from './utils/winstonConfig';

// const NODE_ENV = process.env.NODE_ENV || 'development';
const LOCAL_TIMEZONE = process.env.LOCAL_TIMEZONE || 'Europe/Helsinki';

class App {
    public app: express.Application;
    public server: http.Server;

    private authRoutes: AuthRoutes = new AuthRoutes();
    private mongoUrl: string = process.env.DB_CONNECTION || 'mongodb://localhost:27017/test';

    constructor() {
        this.app = express();
        this.config();
        this.mongoSetup();

        this.server = http.createServer(this.app);
        WsController.buildWebSocketServer(this.server);
        this.initializeRouters();
    }
    private config = (): void => {
        // logger
        morgan.token('date', (req, res, tz) => {
            return moment().tz(tz as string).format();
        });
        morgan.format('myFormat', `[:date[${LOCAL_TIMEZONE}] ":method :url" :status :res[content-length] - :response-time ms`);
        // const morgan_option = NODE_ENV === 'development' ? 'dev' : 'combined';
        this.app.use(morgan('myFormat'));

        // request body parser
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.raw({
            type: 'application/octet-stream',
        }));
        this.app.use(bodyParser.urlencoded({ extended: true }));

        this.app.use(cors());
    }

    private initializeRouters = (): void => {
        this.app.use(express.static(path.join(__dirname, '../../public')));

        this.app.use('/auth', this.authRoutes.router);
        this.app.use('*', (err,req, res, next) => { // avoid recursive errors
            res.status(404).send("path not found");
        })
    }

    private mongoSetup = async () => {
        require('mongoose').Promise = global.Promise;
        try {
            await mongoose.connect(this.mongoUrl, { useNewUrlParser: true, useFindAndModify: false });
        } catch (err) {
            new Logger('MongoDB Error').error(err.message, err.stack);
        }
    }



}

export default new App();