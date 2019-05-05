const hcaProto = require('./hcaProto')
const chalk = require('chalk');
const Queue = require('queue-fifo');

// const this.clientUpdates = 0x00FF; //Don't support any clients
// const this.clientName = 'ClientSim';
// const this.clientPassword = 'someTestPassword';

//=========================================================================
// HcaConnection - is designed to look like a HCA internal obeject (proxy)
//=========================================================================
// This object has been published here: 
// https://www.homecontrolassistant.com/download/V15/Doc/a07_Object%20Model.pdf
//=========================================================================
class HcaConnection extends hcaProto {
    constructor(clientName, password,unsolicatedEvents, webSocket, formater) {
        super(webSocket);
        this.clientName =clientName;
        this.password =  password; 
        this.unsolicatedEvents = unsolicatedEvents;

        //this.WebSocket = webSocket;
        this.Formater = formater;
        this.on('submittPassword', this.setPassword.bind(this));
        this.on('setClientOptions', this.setClientOptions.bind(this));
        this.on('msg', this.handleMessage.bind(this));

        //MessageArray and Queue
        this.msgControl = {};
    }

    

    handleMessage(data) {
        const messageResponse = this.Formater.parse(data);
        const skip = messageResponse.length <= 0;
        

        if (skip) {
            console.log(chalk.grey(`Eval Msg Rcv data:[${chalk.blue(data)}] - ${chalk.yellow('Skipping Message')}`));
            return true; //Process next item in the event chain
        }

        switch (messageResponse[2]) {
            case 'Update': //Requires Bitmap 0x0001
            case 'Notify': //Requires Bitmap 0x0002
            case 'UserDiaglog': //Requires Bitmap 0x0010
            case 'UserDiaglogReport': //Requires Client Initation 
            case 'TileUpdate': //Requires Bitmap 0x0008
            case 'PlaySound': //Requires Bitmap 0x0020
            case 'TextToSpeech': //Requires Bitmap 0x0020
            case 'ServerStatus': //Requires Bitmap 0x0004
            case 'ExtServerStatus': 
            case 'LogAdd':    //Requires Bitmap 0x0200
            case 'DisplayChange': //Requires Bitmap 0x0008
            //Note: Documentation Page 47 looks incorrect
            case 'DisplayTextChange': //Requires Bitmap 0x0008
                console.log(chalk.grey(`Eval UnSolictedMsg [${messageResponse[2]}] data:[${chalk.blue(data)}]`));
                console.dir(messageResponse);
                
                break;
        
            default:                
                //console.log(chalk.grey(`Eval SolictedMsg data:[${chalk.blue(data)}]`));
                this.handleSolictedMessage(messageResponse);
                break;
        }

        return false; // Don't process the next Item in the list - we have just performed that task.
    }

    handleSolictedMessage(messageResponse) {
        const failState = this.processProtocolResultCode(messageResponse[0]);
        const index = `${messageResponse[1]}_${messageResponse[2]}`;
        
        if(!this.msgControl[index]){
            console.log(`Unable to process ${index} due to lack of queue`);
            this.msgControl[index] = new Queue();
        }else{
            //console.log(`processing ${index}`);
            
        }
        //console.dir(this.msgControl,{depth:1});
        const handler = this.msgControl[index].dequeue();
        //this.msgControl[messageResponse[1]][messageResponse[2]] = null;
        if (handler == null){// then the list was empty... 
            console.dir(messageResponse);
            throw new Error(`System out-of-sync, recived more messages for ${index} then were sent by system.`);
        }

        if (!failState)
            handler.resolve(messageResponse);
        else
            handler.reject(failState);
        
    }

    sendMessage(arg) {
        const index = `${arguments[0]}_${arguments[1]}`;
        //console.dir(this.messageControl)
        const textArgs = [...arguments].map(e=>e.toString());
        const data = this.Formater.stringify(...textArgs);
       //console.log(chalk.grey(`Eval Msg Xmit:[${chalk.blue(index)}] data:[${chalk.blue(data)}]`));
        if (!this.msgControl[index]) this.msgControl[index] = new Queue();

        const rVal = new Promise((resolve, reject) => {
            this.msgControl[index].enqueue({
                resolve: resolve,
                reject: reject
            });
            this.connection.send(data);
        });

        //this.msgControl[index].enqueue(rVal);

        //console.dir(this.msgControl,{depth:1});
        return rVal;
    }

    processProtocolResultCode(code) {
        switch (code) {
            case -100:
                return new Error('Problem with decoding the string.');
                break;
            case -102:
                return new Error('Less than 2 arguments in the string.');
                break;
            case -103:
                return new Error(`Invalid group. The 1st argument isn’t HCAObject or HCAApp.`);
                break;
            case -104:
                return new Error(`HCAObject group error - the object.method doesn’t exist or the string doesn’t contain a ‘.’. For HCAApp group, the command named doesn’t exist.`);
                break;
            case -105:
                return new Error(`The number of arguments to the object method doesn’t match the method, or the type of the arguments is incorrect.`);
                break;
            default:
                return null;
                break;
        }
    }

    async setPassword(serverData) {
        console.log(chalk.yellow(`Server version:[${chalk.grey(serverData.serverVersion)}]  Requested Password - clientPos:[${chalk.grey(serverData.clientNum)}] Server:[${chalk.grey(serverData.serverVersion)}]`));
        const password = this.clientPassword;
        const response = this.sendMessage('HCAObject', 'SetPassword', '4', password); //4=Remote Access
        return await response;
    }
    async setClientOptions(stateChangeBitmap, recommededClientName) {
        const myStateBitmap = stateChangeBitmap | this.clientUpdates;
        console.log(chalk.yellow(`Configure Client Name:[${chalk.grey(this.clientName)}] ListeningTo:[${chalk.grey(myStateBitmap)}]`));
        const response = await this.sendMessage('HCAApp', 'SetClientOptions', myStateBitmap, this.clientName);
        //console.dir(response);
        return response;
    }


    processResultCode(code) {
        switch (code) {
            case -1:
                throw new Error('Invalid Paramter.');
                break;
            case -2:
                throw new Error('Action not applicable.');
                break;
            case -3:
                throw new Error('Need Remote Access Password.');
                break;
            case -4:
                throw new Error('Device, Program, Group, or Controller disabled.');
                break;
            case -5:
                throw new Error('Hardware needed to complete the operation is not available.');
                break;
            case -6:
                throw new Error('Did not work.');
                break;
            default:
                break;
        }
    }



    //=========================================================================
    // getDeviceStateOnServer - will retrive the status of the device on the 
    //                          server.
    // returns: the status of the device. 0,1,2 (off,on,dim) Respectively
    //=========================================================================
    // Note: there is a sister method to this funciton that will query the 
    //       device to determine its status.
    // 
    // Parms: devicename - is the path to the device in the system 
    //        {{room}} - {{device}}
    //=========================================================================
    async getDeviceStatusOnServer(deviceName) {
        console.log(chalk.yellow(`Get Device Status On Server[${chalk.grey(deviceName)}]`));
        const response = await this.sendMessage('HCAObject', 'Device.State', deviceName);
        return response[3];
    }

    //=========================================================================
    // deviceOn  - will ask the server to turn on the device.
    // returns: true if the device is in the on state
    //=========================================================================
    // Parms: devicename - is the path to the device in the system 
    //        {{room}} - {{device}}
    //=========================================================================
    async deviceOn(deviceName) {
        console.log(chalk.yellow(`Turn On Device[${chalk.grey(deviceName)}]`));
        const response = await this.sendMessage('HCAObject', 'Device.On', deviceName);
        return response[3] == 1; //Is it on?
    }

    //=========================================================================
    // deviceOff  - will ask the server to turn off the device.
    // returns: true if the device is in the off state
    //=========================================================================
    // Parms: devicename - is the path to the device in the system 
    //        {{room}} - {{device}}
    //=========================================================================
    async deviceOff(deviceName) {
        console.log(chalk.yellow(`Turn Off Device[${chalk.grey(deviceName)}]`));
        const response = await this.sendMessage('HCAObject', 'Device.Off', deviceName);
        return response[3] == 0; //Is it on?
    }



    //=========================================================================
    // flagGet - will look up the flag's type, and will retrive that flag 
    //           from the server using the correct formatting
    // Returns:  a value that represents the value on the server (inluding type). 
    //=========================================================================    
    // Parms: flagName - is the unique string for a flag on the server. 
    //=========================================================================
    // Notes:
    //  https://docs.microsoft.com/en-us/windows/desktop/api/wtypes/ne-wtypes-varenum
    //=========================================================================
    async flagGet(flagName) {
        //Optimization: on connection, download all Flags, and Flag Types, and build a Function array
        //              to query any flag (that will precalculate the research step of this funcition)
        console.log(chalk.yellow(`Query Flag:[${chalk.grey(flagName)}]`));
        const typeFields = await this.sendMessage('HCAObject', 'Flag.GetType', flagName);
        //console.dir(typeFields);

        let response = null;
        switch (typeFields[3]) {
            case '8': //VT_BSTR
            case '3': //VT_I4
                response = await this.sendMessage('HCAObject', 'Flag.GetText', flagName);
                // console.dir(response);
                return response[3];
                break;
            case '11': //VT_BOOL 
                response = await this.sendMessage('HCAObject', 'Flag.GetYesNo', flagName);
                // console.dir(response);
                return response[3] === '-1';
                break;
            case '7': //VT_DATE
                response = await this.sendMessage('HCAObject', 'Flag.GetDate', flagName);
                // console.dir(response);
                return new Date(response[3]);
                break;
            default:
                response = await this.sendMessage('HCAObject', 'Flag.GetNumber', flagName);
                // console.dir(response);
                return Number.parseFloat(response[3]);
                break;
        }

        return null;
    }

    //=========================================================================
    // flagSet - will look up the flag's type, and will push the given value
    //           to the server using the correct formatting
    //=========================================================================
    // Parms: flagName - is the unique string for a flag on the server. 
    //        value - the value that will be sent to the server.
    //=========================================================================
    // Notes:
    //  https://docs.microsoft.com/en-us/windows/desktop/api/wtypes/ne-wtypes-varenum
    //=========================================================================
    async flagSet(flagName, value) {
        //Optimization: on connection, download all Flags, and Flag Types, and build a Function array
        //              to query any flag (that will precalculate the research step of this funcition)
        console.log(chalk.yellow(`Set Flag:[${chalk.grey(flagName)}]`));
        const typeFields = await this.sendMessage('HCAObject', 'Flag.GetType', flagName);
        //console.dir(typeFields);

        let response = null;
        switch (typeFields[3]) {
            case '8': //VT_BSTR
            case '3': //VT_I4
                response = this.sendMessage('HCAObject', 'Flag.SetText', flagName, value);
                break;
            case '11': //VT_BOOL
                response = this.sendMessage('HCAObject', 'Flag.SetYesNo', flagName, value);
                break;
            case '7': //VT_DATE
                response = this.sendMessage('HCAObject', 'Flag.SetDate', flagName, value);
                break;
            default:
                response = this.sendMessage('HCAObject', 'Flag.SetNumber', flagName, value);
                break;
        }
        //console.dir(await response);
        return await response;
    }

    async enumDevices() {
        console.log(chalk.yellow(`enumerate all devices`));
        const rVal = [];
        const fields = await this.sendMessage('HCAObject', 'Device.Count');
        console.dir(fields);

        const enumCount = Number.parseInt(fields[3]);
        console.log(`enumDevices.length:[${enumCount}]`);
        for (let index = 0; index < enumCount; index++) {
            const fields = await this.sendMessage('HCAObject', 'Device.Name', index);
            //console.dir(fields);

            //console.log(`enumDevice[${index}] = [${fields[3]}]`);
            rVal.push(fields[3]);
        }

        return rVal;
    }

    async enumFlags() {
        console.log(chalk.yellow(`enumerate all flags`));
        const rVal = [];
        const fields = await this.sendMessage('HCAObject', 'Flag.Count');
        console.dir(fields);

        const enumCount = Number.parseInt(fields[3]);
        console.log(`enumFlag.length:[${enumCount}]`);
        for (let index = 0; index < enumCount; index++) {
            const fields = await this.sendMessage('HCAObject', 'Flag.Name', index);
            //console.dir(fields);

            //console.log(`enumDevice[${index}] = [${fields[3]}]`);
            rVal.push(fields[3]);
        }

        return rVal;
    }


}

module.exports = HcaConnection;