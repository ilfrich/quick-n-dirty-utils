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

const SORT_DIRECTIONS = {
    ASC: "asc",
    DESC: "desc",
}

/**
 * Utilities used across components
 */
const util = {
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
            Accept: "application/json",
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
        let compareFunction = x => x <= stop
        if (step < 0) {
            compareFunction = x => x >= stop
        }
        // fill array
        for (let i = start; compareFunction(i); i += step) {
            result.push(i)
        }
        return result
    },

    copyToClipboard(text) {
        if (document != null) {
            // copy string
            const el = document.createElement("textarea")
            el.value = text
            document.body.appendChild(el)
            el.select()
            document.execCommand("copy")
            document.body.removeChild(el)
        }
    },

    getTricolor(percent, colors = this.redBlueTricolor) {
        const w1 = percent <= 0.5 ? this.normalise(percent, 0, 0.5) : this.normalise(percent, 0.5, 1)
        const w2 = 1 - w1

        const color1 = percent > 0.5 ? colors[2] : colors[1]
        const color2 = percent > 0.5 ? colors[1] : colors[0]

        const rgb = [
            Math.round(color1[0] * w1 + color2[0] * w2),
            Math.round(color1[1] * w1 + color2[1] * w2),
            Math.round(color1[2] * w1 + color2[2] * w2),
        ]
        return `rgb(${rgb.join(",")})`
    },

    redBlueTricolor: [
        [248, 105, 107], // red
        [255, 255, 255], // white
        [90, 138, 198], // blue
    ],

    redGreenTricolor: [
        [180, 30, 30], // red
        [160, 160, 70], // yellow
        [30, 180, 30], // green
    ],

    downloadFile(stringContent, contentType, filename) {
        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
            const blob = new Blob([decodeURIComponent(encodeURI(stringContent))], { type: contentType })
            navigator.msSaveOrOpenBlob(blob, filename)
        } else {
            const a = document.createElement("a")
            a.download = filename
            a.href = `data:${contentType},${encodeURIComponent(stringContent)}`
            a.target = "_blank"
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
        }
    },

    exportToJson(objectData = {}, filename = "export.json") {
        const contentType = "application/json;charset=utf-8;"
        this.downloadFile(JSON.stringify(objectData), contentType, filename)
    },

    toggleItem(list, item) {
        const index = list.indexOf(item)
        if (index === -1) {
            list.push(item)
            return list
        }
        list.splice(index, 1)
        return list
    },

    /**
     * Helper to initialise a sorting definition for a React component state.
     * @param {string} sortKey - the key / field to sort by default - default "date"
     * @param {string} defaultDirection - the default sort direction - default: "asc"
     * @returns {Object} a JSON object representing a sorting definition
     */
    initSorting(sortKey, defaultDirection = null) {
        if (sortKey == null) {
            return this.initSorting("date", defaultDirection)
        }
        if (defaultDirection == null) {
            return this.initSorting(sortKey, SORT_DIRECTIONS.ASC)
        }
        return {
            key: sortKey,
            direction: defaultDirection,
        }
    },

    /**
     * State update handler when changing the sorting of a list in a React component.
     * @param {Object} oldState - the old React component state
     * @param {string} sortKey - the field / key to sort elements by
     * @param {string} stateKey - optional, the key in the state holding the sorting object (key and direction) - default "sorting"
     * @param {string} defaultDirection - optional, the default sort direction, if the sortKey is not the current sort key - default "asc"
     * @returns {Object} a JSON copy of the old state with the new updated sorting definition
     */
    updateSorting(oldState, sortKey, stateKey = null, defaultDirection = null) {
        if (stateKey == null) {
            return this.updateSorting(oldState, sortKey, "sorting", defaultDirection)
        }
        if (defaultDirection == null) {
            return this.updateSorting(oldState, sortKey, stateKey, SORT_DIRECTIONS.ASC)
        }
        const stateUpdate = { ...oldState }
        const existingSorting = oldState[stateKey]
        if (existingSorting == null) {
            // initialise the sorting
            stateUpdate[stateKey] = self.initSorting(sortKey, defaultDirection)
        } else if (existingSorting.key === sortKey) {
            // reverse direction
            existingSorting.direction =
                existingSorting.direction === SORT_DIRECTIONS.ASC ? SORT_DIRECTIONS.DESC : SORT_DIRECTIONS.ASC
        } else {
            // set new sort key and default direction
            existingSorting.key = sortKey
            existingSorting.direction = defaultDirection
        }

        return stateUpdate
    },

    /**
     * Provides a sort function for the given key / direction.
     * @param {Object} sorting a sorting definition containing "key" and "direction"
     * @param {Array.<string>} stringKeys the list of sort keys that should be sorted as strings
     * @param {Array.<string>} booleanKeys the list of sort keys that should be sorted as boolean (true first = asc)
     * @returns {Function} a sorting lambda
     */
    sort(sorting, stringKeys = [], booleanKeys = []) {
        const { key, direction } = sorting
        return (a, b) => {
            // extract values
            let aVal = a
            let bVal = b
            if (key.includes(".")) {
                key.split(".").forEach(subKey => {
                    if (aVal != null) {
                        aVal = aVal[subKey]
                    }
                    if (bVal != null) {
                        bVal = bVal[subKey]
                    }
                })
            } else {
                aVal = aVal[key]
                bVal = bVal[key]
            }

            if (stringKeys.includes(key)) {
                // perform string search
                if (direction === SORT_DIRECTIONS.ASC) {
                    return aVal.localeCompare(bVal)
                }
                return bVal.localeCompare(aVal)
            }

            if (booleanKeys.includes(key)) {
                if (direction === SORT_DIRECTIONS.ASC) {
                    return aVal ? -1 : 1
                }
                return aVal ? 1 : -1
            }

            // numeric search
            if (direction === SORT_DIRECTIONS.ASC) {
                return aVal - bVal
            }
            return bVal - aVal
        }
    },

    /**
     * Sums up all the values in the provided list
     * @param {Array} list
     */
    sum(list) {
        return list.reduce((a, b) => a + b, 0)
    },

    /**
     * Extracts the query parameter of an URL query string and returns them as JSON object.
     * @param {string} query - the query string starting with ?, like ?foo=bar&abc=def
     * @returns {object} a JSON object with the key/value paris of the query string.
     */
    getQueryStringParams(query) {
        return query
            ? (/^[?#]/.test(query) ? query.slice(1) : query).split("&").reduce((params, param) => {
                  const [key, value] = param.split("=")
                  params[key] = value ? decodeURIComponent(value.replace(/\+/g, " ")) : ""
                  return params
              }, {})
            : {}
    },

    /**
     * Returns an inversed JSON object, where every value becomes the key and maps to its original key.
     * @param {object} jsonObject - a flat JSON object, with simple keys and simple values (boolean, 
     * string, number are supported)
     * @param {boolean} showWarning - optional flag to print out console warnings in case any key/value 
     * pair cannot be mapped or if the JSON object contains duplicates - default = true
     * @returns {object} a JSON object which maps from each value of the input to the key.
     */
    reverseMapping(jsonObject, showWarning = true) {
        const result = {}
        Object.entries(jsonObject).forEach(([key, value]) => {
            if (!["number", "boolean", "string"].includes(typeof value) && showWarning) {
                console.warn("Reverse mapping of value of type", typeof value, "is not possible. Ignoring this value")
                return
            }
            const newKey = `${value}`  // stringify
            if (result[newKey] != null) {
                // already set
                console.warn("Duplicate value", newKey, "in reverse mapping. Ignoring key", key)
                return
            }
            result[newKey] = key
        })
        return result
    },

    /**
     * Useful function for listings / mappings, which allows to use auto-complete / refactoring techniques
     * to lookup the key from its value in that mapping. If a mapping MAP = { "foo": "bar" }, then you can
     * use `keyLookup(MAP, MAP.foo)` to return "foo", without using "foo" as a string, which can introduce
     * difficulties when refactoring.
     * @param {object} jsonMapping - a flag JSON object mapping from keys to simple values (string, boolean,
     * number are supported)
     * @param {string|number|boolean} lookupValue - the value to find the key for
     * @param {boolean} showWarning - optional flag, which is passed into the reverseMapping function to print
     * out warnings in case of issues when creating the reverse mapping.
     * @returns {string} the name of the key for the lookup value
     */
    keyLookup(jsonMapping, lookupValue, showWarning = true) {
        const reverse = this.reverseMapping(jsonMapping, showWarning)
        return reverse[lookupValue]
    },

    /**
     * A function to savely access nested JSON keys in objects. This will handle deeper levels and especially
     * if keys higher up in the hierarchy are not set.
     * @param {Object} object - a JSON object
     * @param {key} key - a string that can include dots (.) for nested JSON keys
     * @returns {Object} null if the key does not exist in the object or the resolved value
     */
    jsonGet(object, key) {
        if (object == null) {
            return null
        }

        if (!key.includes(".")) {
            // simply return the value
            return object[key]
        }

        // split the key and initialise current object
        let current = object
        const keys = key.split(".")
        // iterate through keys navigating through
        keys.forEach(k => {
            if (current == null) {
                return
            }
            current = current[k]
        })

        // return the final value after iterating through all keys
        return current
    },

    /**
     * A function that will map a list of items to a JSON object which contains keys extracted from each item 
     * and the value is the object from that list with that key. If multiple values map to the same keys an array
     * of objects will be mapped to that key.
     * @param {Array} list - a list of items
     * @param {string|function} - a string key (can contain . for nested levels) or a lambda that does the extraction
     * for each item.
     */
    mapListToKeyObject(list, keyOrFunction) {
        // check if it's a simple key mapping or lambda
        const lambda = ["number", "string"].includes(typeof keyOrFunction) ? obj => obj[keyOrFunction] : keyOrFunction
        
        const result = {}
        if (list == null || keyOrFunction == null || list.forEach == null) {
            return result
        }

        list.forEach(item => {
            const key = lambda(item)
            if (result[key] == null) {
                // first item for this key
                result[key] = item
            } else {
                // multiple items for the same key (might have to convert to array)
                if (!Array.isArray(result[key])) {
                    // not yet an array, convert the old item stored there
                    result[key] = [result[key]]
                }
                // push the new item
                result[key].push(item)
            }
        })

        return result
    },
}

export default util
