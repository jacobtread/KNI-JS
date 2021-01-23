# KAMAR Notices Interface
Node/JavaScript Edition

KNI (KAMAR Notices Interface) is a project designed to bring a way of accessing notices from
the [KAMAR](https://kamar.nz) portal software. KNIs goal is to produce usable libraries in as many
languages as possible

[![NPM](https://nodei.co/npm/kni-js.png)](https://nodei.co/npm/kni-js/)

KNI is available on NPM 
```console
$ npm i kni-js
```



### Retrieving Notices
```javascript
const KNI = require('kni-js')

const kni = new KNI(host = 'demo.school.kiwi');
kni.retrieve('01/01/2020').then(response => {
    const notices = response.notices;
    for (let i = 0; i < notices.length; i++) {
        console.log(notices[i]);
    }
}).catch(error => {
    console.error(error)
})
```

By Jacobtread
