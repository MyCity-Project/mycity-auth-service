import * as http from 'http';
import * as WebSocket from 'ws';

interface IMessage {
    type: string; value: number | boolean | number[] | string;
}

export class WsController {
    public static buildWebSocketServer = (server: http.Server) => {
        WsController.wss = new WebSocket.Server({ server, path: '/ws' });
        WsController.connectWebSocketServer();
    }
    /**
     * 
     * Send updated data to synchronize all clients
     * @param {IMessage} json_msg json type message to clients
     * 
     */
    public static sendMessage = (type: IMessage['type'], value: IMessage['value']): void => {
        // websocket send only string text
        const json_msg = {
            type,
            value,
        };
        const msg = JSON.stringify(json_msg);
        // broadcast the message
        for (const client of WsController.wss.clients) {
            client.send(msg);
        }
    }
    public static sendUpdate = (): void => {
        // websocket send only string text
        const json_msg = {
            type: 'update',
        };
        const msg = JSON.stringify(json_msg);
        // broadcast the message
        for (const client of WsController.wss.clients) {
            client.send(msg);
        }
    }
    private static wss: WebSocket.Server;
    private static connectWebSocketServer = () => {
        WsController.wss.on('connection', (ws: WebSocket) => {
            WsController.sendMessage('handShake', 'ok');
        });
    }
}