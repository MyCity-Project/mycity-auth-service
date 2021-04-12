export * from './asyncMiddleware';
export * from './basicAuth';
export * from './timeUtils';
export * from './winstonConfig';
export * from './wsController';
export const parseStringNumberToInt = (object: object) => {
    const newObj = {};
    for (const key in object) {
        if (object.hasOwnProperty(key)) {
            const element = object[key];
            if (element !== null && element !== undefined && element !== '') {
                const num = Number(element);
                if (!isNaN(num)) {
                    Object.assign(newObj, { [key]: num });
                } else {
                    Object.assign(newObj, { [key]: element });
                }
            }
        }
    }
    return newObj;
};
export const isEmpty = (obj: object) => {
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            return false;
        }
    }
    return true;
};