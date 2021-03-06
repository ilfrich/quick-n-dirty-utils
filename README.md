# Quick & Dirty Utilities

Little useful nuggets for accelerated web development.

```bash
npm install --save quick-n-dirty-utils 
```

**Table of Contents**

1. [Functions](#functions)
    1. [Date / Time](#date--time)
    2. [Numbers](#numbers)
    3. [REST](#rest)
    4. [Login](#login)
    5. [Constants](#constants)
    6. [Colors](#colors)
    7. [Others](#others)

## Functions

```javascript
// import dependency
import util from "quick-n-dirty-utils"

// call a function of it
const range = util.range(1, 10)
```

### Date / Time

All date / time functions use `moment` (MomentJS, the de-factor standard library for date/time) to provide the 
functionality.

#### `formatDate(date, format)`
Converts a `Date` object or `moment` object into a string for quick display of dates **without** a time component.
The default format is `YYYY-MM-DD`.

Example:

```jsx harmony
import React from "react"
import util from "quick-n-dirty-utils"

const reactComponent = props => (
    <div>
        {/* prints out a date like 2020-02-18 */}
        <div>{util.formatDate(new Date())}</div>
        
        {/* prints out a date like 18/02/20 */}
        <div>{util.formatDate(new Date(), "DD/MM/YY")}</div>
    </div>
)
```

#### `formatDateTime(dateTime)`
Converts a `Date` object or `moment` object into a string for quick display of dates **with** a time component. If you
require a custom format, you can simply use `formatDate(new Date(), "YY-MM-DD hh:mm:ss)`. The default format is
`DD/MM/YY hh:mm`

Example:

```jsx harmony
import React from "react"
import util from "quick-n-dirty-utils"

const reactComponent = props => (
    <div>
        {/* prints out a date like 18/02/20 09:35 */}
        <div>{util.formatDateTime(new Date())}</div>
    </div>
)
```

#### `applyTimeZoneOffset(timestamp, serverOffsetMin)`
Used to offset mismatching server/client time zones in regards to timestamps. If your server provides Unix timestamps, 
but is located in a different timezone, then simply printing out those timestamps (as `moment`/`Date`) will print the
time in the clients (browser) time zone, not the server time zone. Example: Your server provides timestamps for events 
and the event occurred at midnight, but you are located 2 hours behind the server's time zone. If you use that timestamp
and print out the date (e.g. `util.formatDateTime(new Date(myTimestamp))`), it will show you 10pm, rather than midnight.
Depending on the application, it might be useful to retain the local time.

The function requires you to provide the **server** time zone as offset in minutes. The client's time zone can be 
determined by the browser. Example offsets:
- UTC+10 -> `600`
- UTC-5 -> `-300`

Example:

```javascript
import util from "quick-n-dirty-utils"

const serverTimestamp = 1580777394

// server timezone is +10:00, so the serverOffsetMin is 600 (10 hours * 60 minutes)
let offsetClientDate = new Date(util.applyTimeZoneOffset(serverTimestamp, 10 * 60))

// server timezone is -08:00, so the serverOffsetMin is -480 (8 hours * 60 minutes)
offsetClientDate = new Date(util.applyTimeZoneOffset(serverTimestamp, -8 * 60))
```

### Numbers

#### `range(start, stop, step)`
Familiar to Python programmers, this will create a list of sequential numeric values, e.g. `[1, 2, 3, 4, 5]`.

Example:

```javascript
import util from "quick-n-dirty-utils"

let range = util.range(1, 5)  // will produce [1, 2, 3, 4, 5]
range = util.range(5, 1, -1) // will produce [5, 4, 3, 2, 1]
range = util.range(1, 2, 0.5) // will produce [1, 1.5, 2]
```

#### `normalise(val, min, max)`
This is basically a percentage function that determines the percentage of `val` in the range of `[min, max]`. This 
currently only works for `min < max`.

Example:

```javascript
import util from "quick-n-dirty-utils"

let percentage = util.normalise(3, 0, 20)  // returns 0.15 or 15%
percentage = util.normalise(10, 0, 20)  // return 0.5 or 50%
```

### REST

#### `getJsonHeader()`
Small helper to just provide the `Content-Type` and `Accept` header for a `fetch` REST request.

Example:

```javascript
import util from "quick-n-dirty-utils"

fetch("http://myurl.com", {
    headers: util.getJsonHeader(),
}).then(response => {
    // do something with the response
})
```

#### `getAuthHeader(localStorageKey)`
Small helper to just provide the `Authorization` header for a `fetch` REST request, if the token is stored in the 
browser's `localStorage`. This requires you to first save the required `Authorization` header value in the 
`localStorage`. The default key is "auth_token", but this can be customised for all quick&dirty functions involving 
authentication.

Example:

```javascript
import util from "quick-n-dirty-utils"

fetch("http://myurl.com", {
    // will use the localStorage.getItem("auth_token") as Authorization header value; provide a custom key if required
    headers: util.getAuthHeader(),
}).then(response => {
    // do something with the response
})
```

#### `getAuthJsonHeader(localStorageKey)`
Combines the capabilities of `getJsonHeader()` and `getAuthHeader(localStorageKey)`. If no `localStorageKey` is 
provided, the default (`auth_token`) will be used. This function is the default for a REST interface where the server
requires authentication.

Example:

```javascript
import util from "quick-n-dirty-utils"

fetch("http://myurl.com", {
    // will use the localStorage.getItem("my_token") as Authorization header value; provide a custom key if required
    headers: util.getAuthJsonHeader("my_token"),
}).then(response => {
    // do something with the response
})

```
#### `restHandler(response)`
By default `fetch` doesn't `reject` its promise, if the server responds with a status code >= 400 (e.g. 404, 500). This
little helper can be used to process the result of the initial fetch promise to parse and resolve the response body to 
JSON, if the request was successful. If the request caused a status code >= 400, the promise will be rejected with  the
status code and the response body as payload.

Example:

```javascript
import util from "quick-n-dirty-utils"

fetch("http://myurl.com", {
    headers: util.getAuthJsonHeader(),
})
    .then(util.restHandler)  // here we provide the handler as lambda for the response
    .then(jsonPayload => {
        // do something with the parsed JSON
    })
    .catch(err => {
        console.log("Request returned status code", err.status, "with message:", err.message)
    })
 ```

#### Login

The login functions (including `getAuthJsonHeader()` and `getAuthHeader()`) assume that you use the browser's 
`localStorage` (a permanent storage in the browser per URL) to store the full header value for the `Authorization` 
header and of course that the server is using the `Authorization` header (vs. for example a cookie). So, if your auth
headers look like this: `Authorization: Basic x9fah736mad`, you would store `Basic x9fah736mad` in the `localStorage`.

The default `localStorage` key used is `auth_token`, but this can be overridden in every function using the storage.  

#### `setAuthToken(token, localStorageKey)`
Simple access wrapper for the browser's `localStorage` to store a login token. To be used by `getAuthJsonHeader()` and 
`getAuthHeader()`. The `localStorage` key can be overridden. Default is `auth_token`.

Example:

```javascript
import util from "quick-n-dirty-utils"

fetch("http://myurl.com/login", {
    method: "POST",
    headers: util.getJsonHeader(),
    body: JSON.stringify({ username: "user", password: "mys3cret" }),
})
    .then(util.restHandler)
    .then(jsonPayload => {
        // assuming the JSON response contains the access token in the JSON body under a `userToken` key
        util.setAuthToken(jsonPayload.userToken)
    })
 ```

#### `logout(localStorageKey)`
Counterpart to `setAuthToken(token, localStorageKey)`. This one deletes the key from the browser's `localStorage`. 

Example:

```javascript
import util from "quick-n-dirty-utils"

fetch("http://myurl.com/logout", {
    method: "POST",
    headers: util.getAuthHeader(),
}).then(response => {
    if (response.status === 200) {
        util.logout()
    }
})
 ```

### Constants

#### `DATE_FORMAT`
A simple string used as the default date format: `YYYY-MM-DD`

#### `DATE_TIME_FORMAT`
A simple string used as the default date/time format: `DD/MM/YY hh:mm`

#### `actionTypeSuffixes`
This are suffixes used by `redux` for events regarding REST requests. If you use any request-promise middleware for 
Redux, this will be useful. Using these helpers will avoid typos and thus improve your code quality.

Example:

```javascript
import util from "quick-n-dirty-utils"

const reduxAction = () => ({
    type: "myAction",
    payload: fetch("http://myurl.com/api/data").then(util.restHandler),
})
const initialState = { 
    data: [],
    dataLoading: false, 
}
const MyReducer = (state = initialState, action) => {
    switch (action.type) {
        case `myAction${util.actionTypeSuffixes.fulfilled}`: {
            // the myAction_fulfilled gets emitted when the REST call is completed successful.
            return {
                ...state,
                data: action.payload,
                dataLoading: false,
            }
        }   
        case `myAction${util.actionTypeSuffixes.pending}`: {
            // the type myAction_pending gets emitted as soon as the request has been started.
            return {
                ...state,
                dataLoading: true, 
            }
        }
        case `myAction${util.actionTypeSuffixes.rejected}`: {
            // the type myAction_rejected gets emitted if the request has failed (status code >= 400)
            return {
                ...state,
                dataLoading: false,
            }
        }
        default:
            return state
    }
}
```

If you dispatch `reduxAction()`, it will emit 2 actions: one with suffix `_pending` as soon as fetch has called the URL.
And then when the response of that request comes in either `_rejected` or `_fulfilled`.

### Colors

Some smaller helpers for handling colour gradients.

```javascript
import util from "quick-n-dirty-utils"

util.getTricolor(0.5)  // returns white
util.getTricolor(0.7)  // returns pale blue
util.getTricolor(0.9, util.redGreenTricolor)  // returns almost saturated green
```

#### `getTriColor(percent, colors)`

Returns an `rgb(r, g, b)` value of the given percent value (expressed as `float` between `0.0` and `1.0`) on a tri-color
 spectrum (e.g. red -> yellow -> green or blue -> white -> red).
 
The colors are defaulted to blue (1.0) -> white (0.5) -> red (0.0) and are provided as array of RGB arrays:

```json
[
    [248, 105, 107], // red
    [255, 255, 255], // white
    [90, 138, 198], // blue
]
```

#### `redGreenTricolor`

Static field providing a `colors` setting for the `getTriColor(..)` function for red -> yellow -> green.

### Others

#### `exportToJson(objectData, filename)`

Quickly download any JSON object as a JSON file. This only works in the browser and will
 internally create a `Blob` from the provided `objectData` (which has to be a valid JSON object
 or Array of JSON objects). It then creates a temporary hyperlink, which will trigger the download
 of a file with the given `filename` (defaults to `export.json`). The hyperlink is cleaned up
 after the download is triggered.

#### `downloadFile(stringContent, contentType, fileName)`

Downloads any string as file of the given content type. This only works in the browser and will
 internally create a `Blob` from the provided `stringContent` and creates a temporary hyperlink, 
 which will trigger the download of the file. The `fileName` and `contentType` should be compatible.

#### `toggleItem(list, item)`

This function is useful for React state updates of lists where you want to add/remove an item
 depending on whether the `item` is already in the `list`. Only primitive entries (strings,
 numbers) are supported. The function will return the updated list, with either the `item`
 added, if it didn't exist in it before or removed, if it did. Removal will also modify the 
 original list (using the splice operation).
