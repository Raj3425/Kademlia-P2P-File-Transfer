// Import required modules
let singletonModule = require('./Singleton.js');
let network = require('net');
let kadPTPValue = require('./kadPTP.js');
// Setting network parameters
network.bytesWritten = 300000;
network.bufferSize = 300000;
//network configs
let PORT;
let HOST = '127.0.0.1';
//peer name and connection is set below
let peerN;
let connect = false;
// DHT table to store peer info
let dhtT = [];

// Initialize Singleton module values if timestamp is null
if (singletonModule.getTimestamp() == null) {
    singletonModule.init();
}
// Recieve command line arguments
let joinProcess = process.argv[2];
peerN = process.argv[3];
//try catch for handler
try {
    let serverIPPort = process.argv[5].split(":");
    //set to true now
    connect = true;
    //firstpeer called to send in 0th index value and parsing it
    firstP(serverIPPort[0], parseInt(serverIPPort[1]));
} catch (error) {
    //First peer
    firstP();
}

//function works with first peer 
function firstP(sIP, serverPort) {
    //if connect ion is true and server ip is false and port then set it to servTrue
    let servTrue = !connect && !sIP && !serverPort;
    if (connect && sIP && serverPort) {
        //set client
        let cl = new network.Socket();

        //connect client
        cl.connect(serverPort, sIP, function() {
            //prnt the following when client is connected
            console.log(`Connected to peer ${sIP}:${serverPort} at timestamp: ${singletonModule.getTimestamp()}`);
            //set to local values
            PORT = cl.localPort;
            HOST = cl.localAddress;
            console.log(`This peer address is ${HOST}:${PORT} located at ${peerN} [${singletonModule.getPeerID(HOST, PORT)}]`);
        });
        //handle the data
        cl.on('data', (data) => {
            //handle the packet being retrieved
            handleKADPacket(data);
            //sendHello function called to pass in other function
            sendHello(noNullDHT());
        });

        //when client closes connection
        cl.on('close', function(sock) {
            //close
            console.log('Close');
        });
        if (!servTrue) {
            //if the above is not true, console these lines 
            console.log(`Bucket P7 has no value, adding ${singletonModule.getPeerID(HOST, PORT)}`);
            console.log(`Refresh K-Bucket operation is performed`);
            console.log(`My DHT: \n [P7, ${HOST}:${PORT}, ${singletonModule.getPeerID(HOST, PORT)}]`);
            console.log(`Hello packet has been sent.`);
        }
    } else {
        //set port by getting port
        PORT = singletonModule.getPort();
        //The address of peer
        let addr = `${HOST}:${PORT}`; 
        //push to the table to access later
        pushBucket(dhtT, addr); 
        //peer2peer is set to when a server is created
        let p2p = network.createServer();
        p2p.listen(PORT, HOST, () => {
            //print where and what the peer address is and where its location is at
            console.log(`This peer address is ${HOST}:${PORT} located at ${peerN} [${singletonModule.getPeerID(HOST, PORT)}]`);
        });
        //call handleClientJoin when connected status
        p2p.on('connection', function(sock) {
            handleClientJoin(sock);
        });

        //received data
        p2p.on('data', (data) => {
            console.log('Received Data');
        });
        //close/end connection
        p2p.on('end', function(sock) {
            console.log('End');
        });
        if (!servTrue) {
            //if not true then console the following:
            console.log(`Bucket P7 has no value, adding ${singletonModule.getPeerID(HOST, PORT)}`);
            console.log(`Refresh k-Bucket operation is performed`);
            console.log(`My DHT: \n [P7, ${HOST}:${PORT}, ${singletonModule.getPeerID(HOST, PORT)}]`);
        }
    }
}
//to handle KAD packet
function handleKADPacket(data) {
    //set the following parametrs by calling parseBitPcacket function and assigning corresponding values
    let msg = parseBitPacket(data, 4, 8);
    let vers = parseBitPacket(data, 0, 4);
    let servNL = parseBitPacket(data, 20, 12);
    let peerNum = parseBitPacket(data, 12, 8);
    let servArr = [];

    //push the parsed values into the array
    for (let i = 0; i < servNL; i++) {
        servArr.push(parseBitPacket(data, 32 + i * 8, 8));
    }
    //the name and header size are set here
    let servN = String.fromCharCode.apply(null, servArr);
    let header=32 + (servNL * 8);
    //return if version =/ 9
    if (vers !=9) {
        return;
    }
    //create a temperary array to assign values inside
    let temp =[];
    // If we start filling up on peers, get the information and store it in the array
    if (peerNum> 0) {
        //loop while i less than peerNum
        for (let i = 0; i < peerNum; i++) {
            //set ip for 0, 8, 16, 24 and port number
            let ip0 = parseBitPacket(data, header + 64 * i, 8);
            let ip1 = parseBitPacket(data, header + 8 + 64 * i, 8);
            let ip2 = parseBitPacket(data, header + 16 + 64 * i, 8);
            let ip3 = parseBitPacket(data, header + 24 + 64 * i, 8);
            let portNum = parseBitPacket(data, header + 64 * i + 32, 16);
            temp[i] = `${ip0}.${ip1}.${ip2}.${ip3}:${portNum}`;
        }
    }
    // This message type is the welcome message
    if (msg == 1) {
        let dhtTab = formatTable(temp);
        console.log(`Received Welcome Message from ${servN}`);
        console.log(`along with DHT: ${dhtTab}`);
    }
    // Since we have peers, we will call refreshBuckets with dhtT and temp as arguments
    if (peerNum > 0) {
        refreshBuckets(dhtT, temp);
    }
}



//refresh buckets for DHT
function refreshBuckets(T, LIST) {
    // Cycle through each peer in the list and call pushBucket for each
    for (let i = 0; i < LIST.length; i++) {
        pushBucket(T, LIST[i]);
    }
    //consoles the table
    console.log('Refresh k-Bucket operation is performed.\n');
    console.log('My DHT:');
    let tempVar = noNullDHT();
    //set temp var to the entry and index and console the DHT below
    tempVar.forEach((entry, index) => {
        //set the ip and peerID
        let [ip, peerID] = entry.split(', ');
        //logs the refresh buckets which is shown below
        console.log(`[P${index + 1}, ${ip}, ${peerID} ]`);
    });
}
// format the table
function formatTable(T) {

    let str = '';
    for (let i = 0; i < T.length; i++) {
        //set the IP and port as below
        let IPaddr= T[i].split(':')[0];
        let port = T[i].split(':')[1];
        //append these values in the formatted format as shown to the string and return it in the functon
        str += `[${T[i]}, ${singletonModule.getPeerID(IPaddr, port)}]\n`;
    }
    return str;
}
//send hello packet to peers
function sendHello(T) {
    for (let i = 0; i < T.length; i++) {
        //
        let host = `${peerValues}, ${singletonModule.getPeerID(peerIP, peerPort)}`;
        //host isnt true set the following
        if (T[i] != host) {
            let IP_Port = T[i].split(",")[0];
            let port = IP_Port.split(':')[1];
            let IP = IP_Port.split(':')[0];
            let pkt = kadPTPValue;
            let arr = [];
            //set arr index 0 to the following parameters and port/IP
            arr[0] = `${port}:${IP}, ${singletonModule.getPeerID(IP, port)}`;
            let res = "";
            for (var j = 0; j < peerN.length; j++) {
                res += peerN.charCodeAt(0).toString(2).padStart(8, '0');
            }
            let res1 = parseInt(res, 2);
            //initialize with these values below
            pkt.init(7, 2, 1, peerN.length, res1, arr);
            //creates a connection 
            let t = network.createConnection(port, IP);
            //writes this pkt info because of connection
            t.write(pkt.getBytePacket());
        }
    }
    //finally prints message
    console.log('Hello packet has been sent.');
}

// Function to handle client joining the server
function handleClientJoin(sock) {
    //sock addr is set to below
    let sAddr = `${sock.remoteAddress}:${sock.remotePort}`;
    //prints where the peer is connected from
    console.log(`Connected from peer ${sAddr}`);
    // Sending welcome message packet
    let packet = kadPTPValue;
    let res = "";
    for (var i = 0; i < peerN.length; i++) {
        res += peerN.charCodeAt(0).toString(2).padStart(8, '0');
    }
    let res1 = parseInt(res, 2);
    //initialize packet wth the following terms 
    packet.init(7, 1, DHTTableSize(), peerN.length, res1, noNullDHT());
    //socket writes the packet in byte
    sock.write(packet.getBytePacket());
    //pushes the bucket
    pushBucket(dhtT, sAddr);
    //the peer addr and ID is set below
    let newPeerAddress = `${sock.remoteAddress}:${sock.remotePort}`;
    let newPeerID = singletonModule.getPeerID(sock.remoteAddress, sock.remotePort);
    // Calculate the ID of the current peer
    let myPeerID = singletonModule.getPeerID(HOST, PORT); 
    let bucketIndex = calculateBucketIndex(newPeerID, myPeerID);
    pushBucket(dhtT, newPeerAddress, bucketIndex);
    //console these for the k-bucket and DHT
    console.log(`Bucket P${bucketIndex} has no value, adding ${newPeerID}`);
    console.log(`Refresh k-Bucket operation is performed`);
    console.log(`My DHT: \n [P${bucketIndex}, ${sock.remoteAddress}:${sock.remotePort}, ${newPeerID}]`);
}


// Function to push peer to the bucket
function pushBucket(T,P) {
    //set the follopwing IP and port
    let pushPort = P.split(':')[1];
    let pushIP = P.split(':')[0];
    //set parameters for server ID and ID
    let serverID = singletonModule.getPeerID(HOST, PORT); 
    let pushid = singletonModule.getPeerID(pushIP, pushPort);
    let pBits = singletonModule.Hex2Bin(pushid);
    let sBits = singletonModule.Hex2Bin(serverID);
    //index initially 0
    let ind = 0;
    //xor for the KAD function
    let xor = singletonModule.XORing(pBits, sBits);
    // If the bits match, the XOR operation returns 0, split the XOR at the first 1 and determine the length
    ind = xor.split('1')[0].length - 1;
    // Check if there is something at the index
    if (dhtT[ind] != null) {
        //dht id formatted below
        let dhtID = dhtT[ind].split(',')[1];
        dhtID.replace(' ', '');
        //the dht bits are returns in hex to binary
        let dhtBits = singletonModule.Hex2Bin(dhtID);
        //get distances and store them
        let result0 = singletonModule.XORing(sBits, dhtBits); 
        let result1 = singletonModule.XORing(sBits, pBits);
        //when the value is 1 it shows that its different and find index on result0 result1 
        let scan = singletonModule.XORing(result0, result1);
        let scanInd = scan.split('1');
        //set the index to check similarity
        scanInd = scanInd[0].length - 1;
        if (result1.charAt(scanInd) == 0) {
            //set dht at index to the push IP and port and ID
            dhtT[ind] = `${pushIP}:${pushPort}, ${pushid}`;
        }
    } else {
        // If the table is empty at the index, add value
        dhtT[ind] = `${pushIP}:${pushPort}, ${pushid}`; 
    }
}
//calculate the bucket index
function calculateBucketIndex(p1, p2) {
    // convert the peer ID hex to bin
    let b1 = singletonModule.Hex2Bin(p1);
    let b2 = singletonModule.Hex2Bin(p2);
    //XOR of the two values
    let xorValue = singletonModule.XORing(b1, b2);
    let bucketI = xorValue.indexOf('1');
    //return -1 when two ID are similar
    if (bucketI === -1) {
        return -1;
    }
    //returns the index of bucket
    return bucketI;
}
//find DHT table length
function DHTTableSize() {
    //num of peers
    let numP = 0;
    for (let i = 0; i < dhtT.length; i++) {
        //if the table is null at index i
        if (dhtT[i] != null) {
            //increment num of peers
            numP++;
        }
    }
    //return num of peers
    return numP;
}
//parse bit packet
function parseBitPacket(packet, offset, length) {
    let number = "";
    for (var i = 0; i < length; i++) {
        // retrieve byte position of offset
        let bytePosition = Math.floor((offset + i) / 8);
        let bitPosition = 7 - ((offset + i) % 8);
        let bit = (packet[bytePosition] >> bitPosition) % 2;
        number = (number << 1) | bit;
    }
    return number;
}  
//return DHT table with no null
function noNullDHT() {
    let temp = 0;
    let DHT = [];
    for (let i = 0; i < dhtT.length; i++) {
        if (dhtT[i] != null) {
            DHT[temp] = dhtT[i];
            temp++;
        }
    }
    return DHT;
}

