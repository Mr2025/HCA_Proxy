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
const sut = require('../hcaWireFormat');

//=============================================================================
//Mocha Tests
describe('wireFormatter', function(){        
   
    it('Stringify "HCAObject"', async function(){
        //Arrange
        const expectedVal = '0017    HCAObject';

        //Act
        const actual = sut.stringify('HCAObject')

        //Assert
        actual.should.equal(expectedVal);
    });

    it('Stringify "HCAObject, Device.On"', async function(){
        //Arrange
        const expectedVal = '00210030    HCAObjectDevice.On';

        //Act
        const actual = sut.stringify('HCAObject', 'Device.On')

        //Assert
        actual.should.equal(expectedVal);
    });

    it('Stringify Documentation Given ', async function(){
        //Arrange
        const expectedVal = '003700550076007700780079    HCAObjectDevice.RockerPressBedroom - Bath Lights\0\0\0';

        //Act
        const actual = sut.stringify('HCAObject', 'Device.RockerPress', 'Bedroom - Bath Lights', null,null,null);

        //Assert
        actual.should.equal(expectedVal);
    });

    it('Parse Documentation Given ', async function(){
        //Arrange
        const val= '003700550076007700780079    HCAObjectDevice.RockerPressBedroom - Bath Lights\0\0\0';
        const exp = ['HCAObject', 'Device.RockerPress', 'Bedroom - Bath Lights', null,null,null];

        //Act
        const actual = sut.parse(val);

        //Assert
        actual.should.be.an('array');
        actual[0].should.equal(exp[0]);
        actual[1].should.equal(exp[1]);
        actual[2].should.equal(exp[2]);        
        expect(actual[3]).to.equal(exp[3]);
        expect(actual[4]).to.equal(exp[4]);
        expect(actual[5]).to.equal(exp[5]);        
    });
    
    it('Parse "HCAObject"', async function(){
        //Arrange
        const given = '0017    HCAObject';

        //Act
        const actual = sut.parse(given);

        //Assert
        actual.should.be.an('array');
        actual[0].should.be.equal('HCAObject');
    });

    it('Parse "HCAObject, Device.On"', async function(){
        //Arrange
        const given = '00210030    HCAObjectDevice.On';

        //Act
        const actual = sut.parse(given);

        //Assert
        actual.should.be.an('array');
        actual[0].should.be.equal('HCAObject');
        actual[1].should.be.equal('Device.On');
    });
});
