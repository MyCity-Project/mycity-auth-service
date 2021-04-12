import App from './app';

const PORT = process.env.port || process.env.PORT || 8000;
const { app, server } = App;

// export env values to .pug
app.locals.PORT = PORT;

server.listen(PORT, () => {
    console.log('Express server listening on port ' + PORT);
});