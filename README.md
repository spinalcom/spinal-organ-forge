# spinal-organ-forge

Spinalcom organ that is used to connect to the Autodesk APS API to Spinalhub systems. 

### Node dependency

The organ needs at least node 16

### dowload and install

```
git clone https://github.com/spinalcom/spinal-organ-forge.git
cd spinal-organ-forge
npm i
```

### Create a syslink to viewerForgeFiles

```
ln -s /Path/to/nerve-center/memory/viewerForgeFiles
# can also be the path to .browser_organs/viewerForgeFiles
```

### copy the `.env` to `.env.local` and edit it

```
SPINAL_USER_ID=
SPINALHUB_PROTOCOL=
SPINALHUB_PORT=
SPINALHUB_IP=
SPINAL_PASSWORD=
CLIENT_ID=
CLIENT_SECRET=
```

For the `CLIENT_ID` and `CLIENT_SECRET`, you'll need to get have them in via Autodesk Forge Platform and create an [app]([https://developer.autodesk.com/en/docs/oauth/v2/tutorials/create-app/](https://aps.autodesk.com/en/docs/oauth/v2/tutorials/create-app/)).


#### using nvm ecosystem.config.js

```js
// template ecosystem.config.js
module.exports = {
  apps : [{
    name: "spinal-organ-forge-XXXX",
    script: 'index.js',
    // absolute path of nodejs must be version 16+
    interpreter: "/home/ubuntu/.nvm/versions/node/v18.20.7/bin/node"
  }]
};

```


