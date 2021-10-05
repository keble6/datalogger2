function parseCommand () {
    command = stringIn.substr(0, 2)
    params = stringIn.substr(2, stringIn.length - 2)
    if (command.compare("xx") == 0) {
        serial.writeLine("Deleting log!")
    } else if (command.compare("rt") == 0) {
        serial.writeLine("" + (dateTimeString()))
    } else if (command.compare("st") == 0) {
        setTime()
        serial.writeLine("Time has been set")
    } else if (command.compare("up") == 0) {
        upLoadUSB()
    } else {
        serial.writeLine("Invalid command")
    }
}
function dec2bin (num: number) {
    string = ""
    maxbits = numInputs - 1
    x = num
    for (let i = 0; i <= maxbits; i++) {
        div = 2 ** (maxbits - i)
        bit = Math.floor(x / div)
        string = "" + string + convertToText(bit)
        x = x - bit * div
    }
    return string
}
datalogger.onLogFull(function () {
    loggingEnable = false
})
function leadingZero (num: number) {
    if (num < 10) {
        return "0" + num
    } else {
        return convertToText(num)
    }
}
function dateTimeString () {
    return "" + leadingZero(DS3231.date()) + "/" + leadingZero(DS3231.month()) + "/" + DS3231.year() + " " + leadingZero(DS3231.hour()) + ":" + leadingZero(DS3231.minute()) + ":" + leadingZero(DS3231.second())
}
function setTime () {
    serial.writeLine("" + command + ": " + params)
    yr = params.substr(0, 4)
    mo = params.substr(4, 2)
    dt = params.substr(6, 2)
    hh = params.substr(8, 2)
    mm = params.substr(10, 2)
    DS3231.dateTime(
    parseFloat(yr),
    parseFloat(mm),
    parseFloat(dt),
    1,
    parseFloat(hh),
    parseFloat(mm),
    0
    )
    serial.writeLine("Date & time have been set ")
}
function string2csv (string: string) {
    csv = ""
    bit = 0
    for (let index = 0; index < numInputs - 1; index++) {
        csv = "" + csv + string.charAt(bit) + ","
        bit += 1
    }
    return csv
}
function upLoadUSB () {
    readingsLength = dateTimeList.length
    serial.writeLine("readingsLength = " + readingsLength)
    if (readingsLength != 0) {
        for (let index22 = 0; index22 <= readingsLength - 1; index22++) {
            serial.writeString(dateTimeList[index22])
            basic.pause(10)
            serial.writeString(", ")
            basic.pause(10)
            serial.writeString("" + (string2csv(dec2bin(pinReadingList[index22]))))
            basic.pause(10)
            serial.writeLine("")
            basic.pause(10)
        }
    } else {
        serial.writeLine("No stored readings!")
    }
}
// Serial USB - requires at Terminal: local echo, CR+LF on send, clear input on send
serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    stringIn = serial.readUntil(serial.delimiters(Delimiters.NewLine))
    parseCommand()
})
let lastInNumber = 0
let inNumber = 0
let sampleTime = 0
let pinReadingList: number[] = []
let dateTimeList: string[] = []
let readingsLength = 0
let csv = ""
let mm = ""
let hh = ""
let dt = ""
let mo = ""
let yr = ""
let bit = 0
let div = 0
let x = 0
let maxbits = 0
let string = ""
let params = ""
let stringIn = ""
let command = ""
let loggingEnable = false
let numInputs = 0
// Number of inputs
numInputs = 9
loggingEnable = true
datalogger.includeTimestamp(FlashLogTimeStampFormat.None)
datalogger.setColumns([
"IN1",
"IN2",
"IN3",
"IN4"
])
datalogger.mirrorToSerial(true)
serial.writeLine("Starting DATA LOGGER!")
loops.everyInterval(sampleTime, function () {
    let BTconnected = 0
    inNumber = 0
    inNumber += pins.digitalReadPin(DigitalPin.P1)
    inNumber += 2 * pins.digitalReadPin(DigitalPin.P2)
    inNumber += 4 * pins.digitalReadPin(DigitalPin.P3)
    inNumber += 8 * pins.digitalReadPin(DigitalPin.P4)
    inNumber += 16 * pins.digitalReadPin(DigitalPin.P5)
    inNumber += 32 * pins.digitalReadPin(DigitalPin.P6)
    inNumber += 64 * pins.digitalReadPin(DigitalPin.P7)
    inNumber += 128 * pins.digitalReadPin(DigitalPin.P8)
    inNumber += 256 * pins.digitalReadPin(DigitalPin.P9)
    // suspend logging if BT connected
    if (inNumber != lastInNumber && BTconnected == 0) {
        serial.writeLine("Logging: " + inNumber)
        // store timestamp
        dateTimeList.push(dateTimeString())
        // store pin state
        pinReadingList.push(inNumber)
        lastInNumber = inNumber
    }
    // Make a reading once every hour as a heartbeat
    if (DS3231.minute() == 0 && DS3231.second() == 0 && BTconnected == 0) {
        // store timestamp
        dateTimeList.push(dateTimeString())
        // store pin state
        pinReadingList.push(inNumber)
        serial.writeLine("Logging  hourly at  " + dateTimeString())
    }
})
