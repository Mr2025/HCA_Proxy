//Requirements ================================================================
const InvalidArgumentException = require('./InvalidArgumentException');
//const WebSocket = require('ws');
const EventEmitter = require('events')

const CLIENT_UPDATES = 0; //Don't support any clients
const CLIENT_NAME = 'ClientSim';

//HcaProto ====================================================================
//  HcaProto - will perform the protocol for HCA -> primarily focusing on the 
//             handshake between this applicaiton and the server.
//proxyConfiguration ==========================================================
//  webSocket - A dependancy injected class that will connect to the server 
//                    following the node ws specification.
//  submittPassword - a user function that will submitt a password message.  
//                    The proxy will assume it is a async process and wait for 
//                    a resolution.  This function will be submitted an object
//                    with the following properties:  
//                            server: the URL of the target server, as defined 
//                                    in the websocket
//                            clientNum: the number of this connection on the 
//                                    Hca server.  This number will appear to
//                                    the right of the connection, when viewing
//                                    the Connected Client screen of the HCA
//                                    server. 
//                            serverVersion: the version number of the server
//                                    In the format {Major.Minor.Revision}
//  setClientOptions - a user function that will submitt a configuration message
//                    to the HCA server. 

class HcaProto extends EventEmitter{
    constructor(proxyConfiguration){
        super();
        
        if (!proxyConfiguration){
            throw new InvalidArgumentException ('proxyConfiguration', 'Missing Configuration');
        }

        if (!proxyConfiguration.hasOwnProperty('webSocket')){
            throw new InvalidArgumentException ('webSocket', 'Missing injected webSocket');
        }

        this.WebSocket = proxyConfiguration.webSocket;    
        this.connection= null;     
        this.config = proxyConfiguration;

        if (!proxyConfiguration.hasOwnProperty('submittPassword')){
            proxyConfiguration.setPassword = (connection)=>{ throw new Error(`Server:[${connection.server}] requires password, programmer did not defined submittPassword() in the proxyConfiguraiton`)};
        }

        if (!proxyConfiguration.hasOwnProperty('setClientOptions')){
            proxyConfiguration.setClientOptions = (connection)=>{};
        }          
    }

    sendAndWait(data){
       //console.log(`sendAndWait HcaProxy`);
        return new Promise((resolve,reject)=>{
            try{
                this.connection.once('message', (recv)=>{                    
                    resolve(recv);
                })
                this.connection.send(data);
            }catch(error){
                console.dir(error);
                reject(error);
            }
        });
    }

    
    async sendConnection(){
        //Step 1. Send connection string to the server
        const response = await this.sendAndWait("HCA000B015001039")

        //console.dir(response);
        //Step 2. Validate reponse is from the server understanding the message
        const header = response.slice(0,3);        
        if (header !== 'HCA') throw new Error('Expecting Connection Response');
        
        console.log("Client Connected - Message rec'v");      
        //console.dir(response);

        //Step 3. Evaluate Response code.
        const rCd = response[3] >= 0;        
        if (response[3]==='1') throw new Error('First three charaters for connect message are not "HCA"'); //This should never happen
        if (response[3]==='2') throw new Error('Not valid protocol.');
        if (response[3]==='3') throw new Error('Server does not support client version.');
        if (response[3]==='4') throw new Error('client disconnected before message could be processed.');

        const serverConnection =  {
            server:this.connection.url,
            clientNum:Number.parseInt(response[4]),            
            serverVersion: [response.slice(8,10),response.slice(11,13),response.slice(14,16)].join('.')
        };

        //Step 4. Evaluate need for Password
        const reqPass = response[5]!=0;       
        if (reqPass){
            //await this.emit('submittPassword',serverConnection); //TODO: Move to function ivocation

            //SubmittPassword - will wait for a response 
            await this.config.submittPassword(serverConnection);            
            //If function throws, it will kill the Send Connections
        }

        //await this.emit('setClientOptions',CLIENT_UPDATES, CLIENT_NAME) //TODO: Move to function ivocation
        await this.config.setClientOptions(CLIENT_UPDATES,CLIENT_NAME);
        console.log(`Return:[${rCd}] Client#:[${response[4]}] Pass?:[${reqPass}] Proto:[${response[6]}]`);
        return serverConnection;
    }
    

    openServer(ip,port){    //TODO: convert to promise syntax    
       // return new Promise((resolve,reject)=>{
            this.connection = new this.WebSocket(`ws://${ip}:${port}/websocket`, {perMessageDeflate: false,});                
            this.connection.on('open', async (sock) =>
            {            
                // console.log(`open Event - sockDefined:[${!!sock}]`);
                // // Web Socket is connected, send data using send()                
                //     this.connection.send("HCA000B015001039");                
                //     console.log("Client Connect - Message sent");            
                // //}

                const svrResp = await this.sendConnection();            
                this.emit('HcaConnected',svrResp);
            });
            this.connection.on('close', (code, reason) =>
            {
                console.log(`close Event code:[${code}] reason:[${reason}]`);
            });
            this.connection.on('message', (data) => {
                this.emit('msg', data);
            });
            
            this.connection.on('error', (error) =>
            {
                console.log(`error Event [${error}]`);
            });

            // on(event: 'close', listener: (this: WebSocket, code: number, reason: string) => void): this;
            // on(event: 'error', listener: (this: WebSocket, err: Error) => void): this;
            // on(event: 'upgrade', listener: (this: WebSocket, request: http.IncomingMessage) => void): this;
            // on(event: 'message', listener: (this: WebSocket, data: WebSocket.Data) => void): this;
            // on(event: 'open' , listener: (this: WebSocket) => void): this;
            // on(event: 'ping' | 'pong', listener: (this: WebSocket, data: Buffer) => void): this;
        //});
    }

    closeServer(){
        if (this.connection.OPEN || this.connection.OPENING){
            this.connection.terminate();
        }
    }

}

module.exports = HcaProto;