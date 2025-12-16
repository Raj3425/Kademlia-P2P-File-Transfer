let seqN;
let timerInterval = 10;
let timer;

function timerRun() {
    timer ++;
    if (timer == 4294967295) {
        timer = Math.floor(1000 * Math.random()); // reset timer to be within 32 bit size
    }
}

module.exports = {
    init: function() {
        timer = Math.floor(1000 * Math.random()); /* any random number */
        setInterval(timerRun, timerInterval);
        seqN = Math.floor(1000 * Math.random()); /* any random number */
    },

    //getSequenceNumber: return the current sequence number + 1
    //--------------------------
    getSequenceNumber: function() {
        seqN ++;
        return seqN;
    },

    //--------------------------
    //getTimestamp: return the current timer value
    //--------------------------
    getTimestamp: function() {
        return timer;
    },

    //--------------------------
    //getrandom port > 3000
    //--------------------------
    getPort: function() {
        var weight = Math.floor(Math.random()*1000)+1;
        return  Math.floor( Math.random()*weight) + 3001;
    },

    //--------------------------
    //getPeerID: takes the IP and port number and returns 20 bytes Hex number
    //--------------------------
    getPeerID: function (IP, port) {
        var crypto = require('crypto')
        // put the Ip and port in variable IP + ':' + port called data
        var data = IP + ':' + port
        return crypto.createHash('shake256', { outputLength: 4 })
            .update(data)
            .digest('hex')
    },

    //--------------------------
    //getKeyID: takes the key name and returns 20 bytes Hex number
    //--------------------------
    getKeyID: function (key) {
        var crypto = require('crypto')
        return crypto.createHash('shake256', { outputLength: 4 })
            .update(key)
            .digest('hex')

    },

    //--------------------------
    //Hex2Bin: convert Hex string into binary string
    //--------------------------
    Hex2Bin: function (hex) {
        var bin = ""
        hex.split("").forEach(str => {
            bin += parseInt(str, 16).toString(2).padStart(8, '0')
        })
        return bin
    },

    //--------------------------
    //XORing: finds the XOR of the two Binary Strings with the same size
    //--------------------------
    XORing: function (a, b){
    let ans = "";
        for (let i = 0; i < a.length ; i++)
        {
            // If the Character matches
            if (a[i] == b[i])
                ans += "0";
            else
                ans += "1";
        }
        return ans;
    }
};