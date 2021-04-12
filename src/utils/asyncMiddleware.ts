export const asyncMiddleware = fn => (req, res, next = console.error) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};