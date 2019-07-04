//=========================================================================
// hcaWireFormat - is modeled after the JSON interface (stringify, parse)
//                 However, hcaWireFormat is following the HCA standard.
//=========================================================================
// This standard has been published here: (Chapter 2.2 )
// https://www.homecontrolassistant.com/download/V15/Doc/TechNotes/TechNote_450_ServerProtocol.pdf
//=========================================================================
const DELIM = '    ';
class HcaWireFormat{
    //=========================================================================
    // stringify - Given a collection of arguments, it will return a HCA 
    //             compatible wire transport string.
    //=========================================================================
    static stringify(){
        //Step 1. Transform ParamArray into elements (transform null into string rep of null)
        const arg = [];        
        for (let index = 0; index < arguments.length; index++) {
            if (arguments[index]) {
                arg.push(arguments[index]);
            }else{
                arg.push(String.fromCharCode(0));
            }
        }

        //Step 2. Calculate starting location in string
        const count = arg.length;
        const start = (count*4) + DELIM.length; // (4Chars for each ptr, + the blank token. )    

        //Step 3. Calc remaining offsets and pad with 0 (assume 4 digits)
        const starts = [];
        for (let index = 0, ptr = start; index < arg.length; index++) {
            const element = arg[index];
            ptr = ptr+ element.length;               
            starts.push(ptr);
        }     
        const vals = starts.map(e=>e.toString().padStart(4,'0'))

        //Step 4. Format string
        return `${vals.join('')}${DELIM}${arg.join('')}`;
    }

    //=========================================================================
    // parse - Given a HCA transport string, it will return an array of the 
    //         value within that string
    //=========================================================================
    static parse(src){
        //Step 1. Find the first delimiter, use that to calc the starting location
        const tokenIdx = src.indexOf(DELIM);
        const start = tokenIdx + DELIM.length;

        //Step 2. Calc number of item in given string
        const items = tokenIdx / 4;

        //Step 3. retrive the pointers
        const idx = [];
        for (let index = 0; index < items; index++) {
            const element = src.slice(index*4,(index+1)*4);
            idx.push(Number.parseInt(element));        
        }
        
        //Step 4. Slice up the given string, and convert null chars into null objects. 
        const rVal = [];
        for (let index = 0, ptr = start; index < idx.length; index++) {
            const element = idx[index];
            const str = src.slice(ptr,element);
            if (str === String.fromCharCode(0)){
                rVal.push(null);
            }else{
                rVal.push(str);
            }
            
            ptr = element;        
        }

        //Return the array to the user.
        return rVal;
    }
}

module.exports = HcaWireFormat;