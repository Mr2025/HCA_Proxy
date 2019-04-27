//=============================================================================
//Testing harnesses
const chai = require('chai');
const sinon = require('sinon');
chai.should(); //install should operators.
const expect = chai.expect;

//Requirements ================================================================
const WebSocket = require('ws');
const Hca = require('../hcaWireFormat');

//=============================================================================
//Subject under test
const sut = require('../hcaConnection');

//=============================================================================
//Mocha Tests
describe('Connect To Hca Server', function(){            
    it('Test Flag - Recive and Set', async function(){
        //Arrange
        const expected = 'NewFlagValue';
        let actual = null;

        const hcaProxy = new sut(WebSocket,Hca);        
        hcaProxy.on('HcaConnected',async (svr)=>{
            
            //ACT    
            const zztest2_orig = await hcaProxy.flagGet('zztest2');
            await hcaProxy.flagSet('zztest2',expected);
            actual = await hcaProxy.flagGet('zztest2');
            await hcaProxy.flagSet('zztest2',zztest2_orig);

            hcaProxy.closeServer();

            //Assert
            expect(actual).to.exist;
            actual.should.equal(expected);
        });
        hcaProxy.openServer('172.16.5.108','2050',null);
        
    });       
    it('Test Device - On and Off', async function(){
        //Arrange
        const hcaProxy = new sut(WebSocket,Hca);        
        hcaProxy.on('HcaConnected',async (svr)=>{
            
            //Act
            const startStatus = await hcaProxy.getDeviceStatusOnServer('ZTEST - E4 Jason Test');
            if (startStatus == 0 /*Off*/) await hcaProxy.deviceOn('ZTEST - E4 Jason Test');
            if (startStatus == 1 /*On*/) await hcaProxy.deviceOff('ZTEST - E4 Jason Test');

            const AfterStatus = await hcaProxy.getDeviceStatusOnServer('ZTEST - E4 Jason Test');

            if (startStatus == 0 /*Off*/) await hcaProxy.deviceOff('ZTEST - E4 Jason Test');
            if (startStatus == 1 /*On*/) await hcaProxy.deviceOn('ZTEST - E4 Jason Test');   
            
            const endStatus = await hcaProxy.getDeviceStatusOnServer('ZTEST - E4 Jason Test');

            hcaProxy.closeServer();

            //Assert
            startStatus.should.not.equal(AfterStatus);
            startStatus.should.equal(endStatus);
        });  
        hcaProxy.openServer('172.16.5.108','2050',null);

        //Assert
    });       


    it('Test Enum - Devices on server', async function(){
        //Arrange
        const hcaProxy = new sut(WebSocket,Hca);        
        hcaProxy.on('HcaConnected',async (svr)=>{
            
            //Act
            const devices = await hcaProxy.enumDevices();
            
            hcaProxy.closeServer();

            //Assert
            expect(devices).to.exist;
            devices.should.be.an('array');
            devices.length.should.be.gte(1);   
            //console.dir(devices);         
        });  
        hcaProxy.openServer('172.16.5.108','2050',null);

        //Assert
    });       

    it('Test Enum - Flags on server', async function(){
        //Arrange
        const hcaProxy = new sut(WebSocket,Hca);        
        hcaProxy.on('HcaConnected',async (svr)=>{
            
            //Act
            const flags = await hcaProxy.enumFlags();
            
            hcaProxy.closeServer();

            //Assert
            expect(flags).to.exist;
            flags.should.be.an('array');
            flags.length.should.be.gte(1);   
            //console.dir(flags);         
        });  
        hcaProxy.openServer('172.16.5.108','2050',null);

        //Assert
    });       


    it.skip('Test Short Error - Connection Response', async function(){
        //Arrange
        const hcaProxy = new sut(WebSocket,Hca);        
        hcaProxy.on('HcaConnected',async (svr)=>{
            console.dir(svr);

            await hcaProxy.deviceOn('ZTEST - E4 Jason Test');
            await hcaProxy.deviceOff('ZTEST - E4 Jason Test');
            await hcaProxy.deviceOn('ZTEST - E4 Jason Test');
            await hcaProxy.deviceOff('ZTEST - E4 Jason Test');

            const zztest2=await hcaProxy.flagGet('zztest2');
            console.dir(zztest2);

            const xSummerFlag = await hcaProxy.flagGet('xSummerFlag');         
            console.dir(xSummerFlag);

            const WindMax = await hcaProxy.flagGet('WindMax');         
            console.dir(WindMax);

            const AlertMagSw_DiningWin_G4 = await hcaProxy.flagGet('AlertMagSw_DiningWin_G4');         
            console.dir(AlertMagSw_DiningWin_G4);

            const xTotalMin = await hcaProxy.flagGet('xTotalMin');         
            console.dir(xTotalMin);

            //const device = await hcaProxy.enumDevices();
            //console.dir(device);
            hcaProxy.closeServer();
        });
        hcaProxy.on('HcaRecived',(msg)=>{console.dir(msg);});
        
        
        //ACT
        hcaProxy.openServer('172.16.5.108','2050',null);

        //Assert
    });       
});
    
