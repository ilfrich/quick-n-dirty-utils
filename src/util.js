/**
 * Created by Peter Ilfrich
 *
 *
 */
import moment from "moment"

// default date format
const DATE_FORMAT = "YYYY-MM-DD"
// default date/time format
const DATE_TIME_FORMAT = "DD/MM/YY hh:mm"
// localStorage key uses to store the auth token
const LS_AUTH_KEY = "auth_token"

/**
 * Utilities used across components
 */
export default {
    /**
     * Default date format for quick display
     */
    DATE_FORMAT,

    /**
     * Default date and time format for quick display
     */
    DATE_TIME_FORMAT,

    /**
     * Returns the action.type suffixes for the promise redux middleware (used in the reducers)
     */
    actionTypeSuffixes: {
        pending: "_PENDING",
        fulfilled: "_FULFILLED",
        rejected: "_REJECTED",
    },

    /**
     * Uses the hard-coded date format to format the provided date. If no valid date is provided, null is returned.
     * @param {(object|string)} date: the date to format, provided either as string or moment object. If a string is
     * provided, that string needs to be parsable by moment
     * @param {string} dateFormat: the date format to be used by moment to serialise the date, default "YY-MM-DD"
     * @returns {String} the formatted string or null, if the provided date string or object is not valid or cannot be
     * parsed.
     */
    formatDate(date, dateFormat = DATE_FORMAT) {
        const d = moment(date)
        if (d.isValid()) {
            return d.format(dateFormat)
        }
        return null
    },

    /**
     * Uses a hard-coded date/time format to format the provided date. If no valid date is provided, null is returned.
     * @param {(object|string)} date: the date to format, provided either as string or moment object. If a string is
     * provided, that string needs to be parsable by moment
     * @returns {String} the formatted string or null, if the provided date string or object is not valid or cannot be
     * parsed.
     */
    formatDateTime(date) {
        return this.formatDate(date, DATE_TIME_FORMAT)
    },

    /**
     * Normalises a value for a given range as a floating point number. Useful for percentages with custom min/max
     * values.
     * @param {number} val: the value to normalise
     * @param {number} min: the smallest value in the range
     * @param {number} max: the biggest value in the range
     * @returns {number} a value between 0.0 and 1.0, where 0.0 is smaller or equal the 'min' value and 1.0 is larger or
     * equal the 'max' value
     */
    normalise(val, min, max) {
        if (val < min) {
            return 0.0
        }
        if (val > max) {
            return 1.0
        }
        let minValue = min
        let maxValue = max
        if (max < min) {
            minValue = max
            maxValue = min
        }

        if (max === min) {
            return 1.0
        }
        return (val - minValue) / (maxValue - minValue)
    },

    /**
     * Provides the header values for a REST request using JSON payloads to exchange information.
     * @returns {{Accept: string, "Content-Type": string}} a JSON containing all parameters required for content types.
     */
    getJsonHeader() {
        return {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
    },

    /**
     * Retrieves a part of the header responsible for providing an auth token
     * @param {string} [localStorageKey]: optional custom key where the auth token is stored (default: "auth_token")
     * @returns {{Authorization: string}} a JSON containing the authorization header
     */
    getAuthHeader(localStorageKey = LS_AUTH_KEY) {
        return {
            Authorization: localStorage.getItem(localStorageKey),
        }
    },

    /**
     * Stores a given auth token in the browsers local storage to be used by the getAuthHeader and getAuthJsonHeader
     * function.
     * @param {string} token: the full token to be provided to the request as Authorization header
     * @param {string} [localStorageKey]: optional custom key where the auth token is stored (default: "auth_token")
     */
    setAuthToken(token, localStorageKey = LS_AUTH_KEY) {
        localStorage.setItem(localStorageKey, token)
    },
    
    logout(localStorageKey = LS_AUTH_KEY) {
        localStorage.removeItem(localStorageKey)
    },

    /**
     * Retrieves a JSON object representing a request header for an authenticated REST request to a back-end.
     * @param {string} [localStorageKey]: optional custom key where the auth token is stored (default: "auth_token")
     * @returns {{Accept: string, "Content-Type": string, Authorization: string}} a header for an authenticated REST
     * request.
     */
    getAuthJsonHeader(localStorageKey = LS_AUTH_KEY) {
        return {
            ...this.getAuthHeader(localStorageKey),
            ...this.getJsonHeader(),
        }
    },

    /**
     * Helper promise to handle incoming REST responses via fetch. If the response status code is >= 400, the promise
     * will be rejected. Otherwise the response will be parsed into JSON and resolved by the promise.
     * @param {object} response: the request promise returned by fetch
     * @returns {Promise<object>} a promise resolving the JSON body of the incoming request or rejecting with the body
     * text in case of an error status code.
     */
    restHandler(response) {
        return new Promise((resolve, reject) => {
            if (response.status >= 400) {
                reject({
                    status: response.status,
                    message: response.text(),
                })
                return
            }
            resolve(response.json())
        })
    },

    /**
     * Applies an offset to a unix timestamp to allow native JS dates and moment to render the resulting date in the
     * server's timezone, rather than the browsers time zone. The idea is to convert all timestamps of a time series
     * received from a server in a different time into offset timestamps, which then allows to render the data as chart
     * or table using the server's time and not the users time.
     * @param {number} timestamp: the original timestamp in seconds since 1970
     * @param {number} serverOffsetMin: the number of minutes behind UTC (e.g. +10:00 is 600 minutes after UTC)
     * @returns {number} the offset timestamp which when used by moment or as argument for new Date(..) will produce a
     * date / time string in the server's timezone rather than the users/browser timezone
     */
    applyTimeZoneOffset(timestamp, serverOffsetMin = 600) {
        // compute in seconds
        const timeZoneOffsetMinutes = new Date().getTimezoneOffset() + serverOffsetMin
        const timestampOffset = timeZoneOffsetMinutes * 60
        // apply to timestamp
        return Math.round(timestamp) + timestampOffset
    },

    /**
     * Replica of the Python range() function, which allows to create an array of numbers given a start, end and step
     * value. If an invalid range (combination of start, stop and step) is provided, an empty array will be returned.
     * @param {number} start: the first element in the range to be added
     * @param {number} stop: the last element in the range to be added
     * @param {number} [step]: optional step size. If not provided, the default will be 1
     * @returns {Array} a list of numbers
     */
    range(start, stop, step = 1) {
        const result = []
        if ((start > stop && step > 0) || (start < stop && step < 0)) {
            // would cause infinite loop
            return result
        }
        // define compare function for loop
        let compareFunction = x => x <= stop;
        if (step < 0) {
            compareFunction = x => x >= stop;
        }
        // fill array
        for (let i = start; compareFunction(i); i += step) {
            result.push(i)
        }
        return result
    }
}
