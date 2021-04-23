# KAMAR Notices Interface

Node/JavaScript/Typescript Edition

KNI (KAMAR Notices Interface) is a project designed to bring a way of accessing notices from
the [KAMAR](https://kamar.nz) portal software. KNIs goal is to produce usable libraries in as many languages as possible

[![NPM](https://nodei.co/npm/kni-js.png)](https://nodei.co/npm/kni-js/)

KNI is available on NPM

```console
$ npm i kni-js
```

You can provide Date objects, strings or null providing null or no value will use the current date

### Retrieving Notices

```javascript
const KNI = require('kni-js');

const kni = new KNI('portal.your.school.nz'); // Your school portal domain (or https://portal.your.school.nz)
kni.get(
    new Date() /* You can use date objects, string dates, and null (strings must be dd/MM/yyyy e.g 21/12/2021) */)
    .then(response => {
        const generalNotices = response.general; // Get the general notices
        const meetingNotices = response.meetings; // Get the meeting notices
    })
    .catch(err => { // If notices couldn't be retrieved
        console.error('Failed to retrieve notices: ' + err);
    })
```

By Jacobtread
