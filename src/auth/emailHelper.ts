import sendmail = require('sendmail');

const emailSender = sendmail({
    logger: {
        debug: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error
      },
    silent: false,
    devPort: 1025, // Default: False
    devHost: 'localhost', // Default: localhost
    smtpPort: 2525, // Default: 25
    smtpHost: 'localhost' // Default: -1 - extra smtp host after resolveMX
});

export const sendEmail = (options: sendmail.MailInput): Promise<boolean> =>
    new Promise((resolve, reject) => {
        emailSender(options, (err, reply) => {
            console.log(err);
            // if error happened or returned code is now started with 2**
            if (err || !reply.startsWith('2')) {
                reject(err);
            } else {
                resolve(true);
            }
        });
    });