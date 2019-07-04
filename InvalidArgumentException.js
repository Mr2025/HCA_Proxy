class InvalidArgumentException extends Error{
    constructor(parameter, message){
        super(`InvalidArgument:[${parameter}] - ${message}`);
        this.name = 'InvalidArgumentException'
        this.parameter = parameter;
    }

    // get parameter(){
    //     return this.parameter;
    // }    
}

module.exports = InvalidArgumentException;