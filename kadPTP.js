module.exports = {
    //ITP header
    respH: "", 
    //payload
    payload: "", 
    ///length of payload
    payl: 0,
    //set header size
    HEADER_SIZE: 0,
    //initialize the parameters
    init: function (vers, msg, numP, sLength, servN, data) {
        this.HEADER_SIZE = 4 + sLength;
        //set the header to the buffer which is allocated with header size
        this.respH = new Buffer.alloc(this.HEADER_SIZE);
        //name length
        storeBitPacket(this.respH, sLength, 20, 12); 
        //type of msg
        storeBitPacket(this.respH, msg, 4, 8); 
        //type of resp
        storeBitPacket(this.respH, vers, 0, 4); 
        //peers
        storeBitPacket(this.respH, numP, 12, 8); 
        //name 
        storeBitPacket(this.respH, servN, 32, sLength * 8); 
       //complete the payload 
        this.payload = new Buffer.alloc(numP * 8);
        //if the num of peers is greater than 0 then...
        if(numP > 0) {
            for (let i = 0; i < numP; i++){

            //set peer ip and address and port 
            let pAddrPort = data[i].split(',')[0];
            let IP = pAddrPort.split(':')[0].split('.');
            let ip0 = parseInt(IP[0]);
            let ip1 = parseInt(IP[1]);
            let ip2 = parseInt(IP[2]);
            let ip3 = parseInt(IP[3]);
            let pPort = pAddrPort.split(':')[1];
            //call storeBtPacket for every 64 new bits (for IP)
            storeBitPacket(this.payload, ip0, i * 64, 8); 
            storeBitPacket(this.payload, ip1, i * 64 + 8, 8);
            storeBitPacket(this.payload, ip2, i * 64 + 16, 8);
            storeBitPacket(this.payload, ip3, i * 64 + 24, 8);
            //for peer port 4 bytes
            storeBitPacket(this.payload, parseInt(pPort), i * 64 + 32, 16); 
            //rest is set to zero
            storeBitPacket(this.payload, 0, i * 64 + 48, 16);
        }
      }
    },
    getBytePacket: function () {
      let pkt = new Buffer.alloc(this.payload.length + this.HEADER_SIZE);
      //packet s header and payload
      for (var x = 0; x < this.HEADER_SIZE; x++)
      //sets to the respons header value at index
        pkt[x] = this.respH[x];
      for (var y = 0; y < this.payload.length; y++)
        //sets using header size and the payload at index
        pkt[y + this.HEADER_SIZE] = this.payload[y];

      //return packet
      return pkt;
    },
  };

//integer value into the packet bit stream
function storeBitPacket(packet, value, offset, length) {
    //get the actual byte position of the offset
    let lastBitPosition = offset + length - 1;
    let number = value.toString(2);
    let j = number.length - 1;
    for (var i = 0; i < number.length; i++) {
      let bytePosition = Math.floor(lastBitPosition / 8);
      let bitPosition = 7 - (lastBitPosition % 8);
      if (number.charAt(j--) == "0") {
        packet[bytePosition] &= ~(1 << bitPosition);
      } else {
        packet[bytePosition] |= 1 << bitPosition;
      }
      lastBitPosition--;
    }
}