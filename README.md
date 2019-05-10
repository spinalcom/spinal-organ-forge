# spinal-organ-forge

## Dependencies

### Install [pm2](https://github.com/Unitech/pm2) globally
```
$ npm install pm2 -g
```


## Installation

### Initilize a package.json file

```
$ npm init
```

### Install the package locally

```
npm install git+https://github.com/spinalcom/spinal-organ-forge.git
```

This will install the packages
- [spinal-organ-forge](https://github.com/spinalcom/spinal-organ-forge)
  - [spinal-browser-drive](https://github.com/spinalcom/spinal-browser-drive)
    - [spinal-browser-admin](https://github.com/spinalcom/spinal-browser-admin)
      - [spinal-core-hub#3.0.0](https://github.com/spinalcom/spinal-core-hub)
      - [spinal-core-connectorjs#2.3.0](https://github.com/spinalcom/spinal-core-connectorjs)
  - [spinal-lib-forgefile](https://github.com/spinalcom/spinal-browser-admin)
  - [spinal-env-drive-plugin-forge](https://github.com/spinalcom/spinal-env-drive-plugin-forge)



## Configuration

### Edit the file `.config.json`


 the default config is the folowing :
 ```
{
  "spinal-core-hub": {
    "env": {
      "SPINALHUB_PORT": 7777,
      "SPINALHUB_IP": "127.0.0.1"
    },
    ...
  },
  "spinal-organ-forge": {
    "env": {
      "SPINALHUB_PORT": 7777,
      "SPINALHUB_IP": "127.0.0.1",
      "INTERVAL": 2000,
      "CLIENT_ID": "EDIT ME",
      "CLIENT_SECRET": "EDIT ME",
      "SPINAL_USER_ID": "EDIT ME",
      "SPINAL_PASSWORD": "EDIT ME"
    },
    ...
  }
}
```

For the `CLIENT_ID` and `CLIENT_SECRET`, you'll need to get have them in via Autodesk Forge Platform and create an [app](https://developer.autodesk.com/en/docs/oauth/v2/tutorials/create-app/).


For the `SPINAL_USER_ID` and `SPINAL_PASSWORD` the defaut user are listed [here](#basic-usage)


## Run the `launch.config.js` script with pm2
```
$ pm2 start launch.config.js
```

## Basic usage

The organ application is running in the background. It does check all the file which are BIM Project and handle them. You can create a BIM Project via the `spinal-browser-drive` and `spinal-env-drive-plugin-forge` by opening the context menu of a .rvt file.

 (you may change the host/port corresponding to your `.config.json` file):

[`http://127.0.0.1:7777/html/drive/index.html`](http://127.0.0.1:7777/html/drive/index.html)

## The 3 default account

Username | client ID | Password
-|-|-
admin | 168 | JHGgcz45JKilmzknzelf65ddDadggftIO98P
root | 644 | 4YCSeYUzsDG8XSrjqXgkDPrdmJ3fQqHs
user | 1657 | LQv2nm9G2rqMerk23Tav2ufeuRM2K5RG
