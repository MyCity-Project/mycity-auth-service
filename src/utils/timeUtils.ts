import moment from 'moment-timezone';

export class TimeUtils {
    public static getDateFormat = (): string => TimeUtils.dateFormat;
    //public static setDateFormat = (format: string): void => { TimeUtils.dateFormat = format; };
    public static getLocalTimeZone = (): string => TimeUtils.localTimeZone;
    //public static setLocalTimeZone = (localTimeZone: string): void => { TimeUtils.localTimeZone = localTimeZone; };
    public static isDateFormatValid = (date: string): boolean => moment(date, TimeUtils.dateFormat, true).isValid();
    public static getTimeValueFromDate = (date: string, shiftDays?: number): number => {
        if (shiftDays) {
            return moment(date, TimeUtils.dateFormat).add(shiftDays, 'days').valueOf();
        } return moment(date, TimeUtils.dateFormat).valueOf();
    }
    public static getTodayFormattedDate = () =>
     moment().tz(TimeUtils.localTimeZone).format(TimeUtils.getDateFormat());
    public static getCurrentHour = () => moment().tz(TimeUtils.localTimeZone).hours();
    public static getCurrentDate = () => moment().tz(TimeUtils.localTimeZone).toDate();

    private static dateFormat = 'DD-MM-YYYY';
    private static localTimeZone = process.env.LOCAL_TIMEZONE || 'Europe/Helsinki';
}