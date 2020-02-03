# Quick & Dirty Utilities

Little useful nuggets for accelerated web development.

## Functions

### Date / Time

* `formatDate(date, format)`
* `formatDateTime(dateTime, format)`
* `applyTimeZoneOffset(timestamp, serverOffsetMin)`

### Numbers

* `range(start, stop, step)`
* `normalise(val, min, max)`

### REST

* `getJsonHeader()`
* `getAuthHeader(localStorageKey)`
* `getAuthJsonHeader(localStorageKey)`
* `restHandler(response)`

#### Login

* `setAuthToken(token, localStorageKey)`
* `logout(localStorageKey)`
