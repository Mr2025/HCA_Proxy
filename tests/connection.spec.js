//=============================================================================
//Testing harnesses
const chai = require('chai');
const sinon = require('sinon');
//=============================================================================
//Testing runtimes
chai.should(); //install should operators.
const expect = chai.expect;
//=============================================================================
//Subject under test
//const sut = require('../../database/teamManager.js');

//=============================================================================
//DuckTape
var WebSocket = require('ws');
const hca = require('../hcaWireFormat');

//=============================================================================
//Mocha Tests
describe.skip('Connect To Hca Server', function(){        
    it('Test Short Error - Connection Response', async function(){
        //ARRANGE
        //const sut = new teamManager(sqlPool);
        var ws = new WebSocket("ws://172.16.5.108:2050/websocket", {perMessageDeflate: false,});                

        // ws.onopen =  function(sock)
        // {
        //     console.log(`onopen Event - sockDefined:[${!!sock}]`);
        //     // Web Socket is connected, send data using send()    
        //     if (!!sock){
        //         ws.send("HCA000B011002001");
        //         ws.send("002500340049    HCAObjectDevice.OnE4 Jason Test");
        //         console.log("Message sent");            
        //         //done();
        //     }
        // };
        ws.on('open', function(sock)
        {            
            console.log(`open Event - sockDefined:[${!!sock}]`);
            // Web Socket is connected, send data using send()    
            //if (!!sock){
                ws.send("HCA000B015001039");                
                console.log("Client Connect - Message sent");            
                //done();
            //}
        });
        ws.on('close', function(code, reason)
        {
            console.log(`close Event code:[${code}] reason:[${reason}]`);
        });
        ws.on('message', function(data)
        {
            const header = data.slice(0,3);
            console.log(`message Event data:[${data}] header:[${header}]`);
            

            if (header == 'HCA'){
                //This is the Client Connect message. 
                console.log("Client Connect - Message rec'v");      
                const rCd = data[3] >= 0;
                const reqPass = data[5]!=0;
                console.log(`Return:[${rCd}] Client#:[${data[4]}] Pass?:[${reqPass}] Proto:[${data[6]}]`);

                if (rCd){
                    //Send test message
                    console.log("Message sent - Turn On E4");      
                    ws.send(hca.stringify('HCAObject', 'Device.Off', 'ZTEST - E4 Jason Test'));
                    //ws.send(hca.stringify('HCAObject', 'Device.On', 'ZTEST - E4 Jason Test'));                    
                    //ws.send(hca.stringify('HCAObject', 'Device.Name', '120'));
                }
            }
            //Parse message
            
        });
        ws.on('error', function(error)
        {
            console.log(`error Event [${error}]`);
        });
        // on(event: 'close', listener: (this: WebSocket, code: number, reason: string) => void): this;
        // on(event: 'error', listener: (this: WebSocket, err: Error) => void): this;
        // on(event: 'upgrade', listener: (this: WebSocket, request: http.IncomingMessage) => void): this;
        // on(event: 'message', listener: (this: WebSocket, data: WebSocket.Data) => void): this;
        // on(event: 'open' , listener: (this: WebSocket) => void): this;
        // on(event: 'ping' | 'pong', listener: (this: WebSocket, data: Buffer) => void): this;

        //ACT         
        
        //ASSERT        
    });       
});
    
