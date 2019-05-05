//Requirements ================================================================
const WebSocket = require('ws');
const Hca = require('../hcaWireFormat');
const Connection = require('../hcaConnection');


module.exports = (clientName, password,unsolicatedEvents =  0x0000)=>{
    return new Connection(clientName, password,unsolicatedEvents, WebSocket,Hca);
};