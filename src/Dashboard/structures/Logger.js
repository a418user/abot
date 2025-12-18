const chalk = require("chalk");
const { dump } = require('dumper.js');
const moment = require("moment");

module.exports = class Log {

    static dashboard(args) {
        const timestamp = `[${moment().format("DD-MM-YYYY HH:mm:ss")}] :`;
        console.log(chalk.yellow.bold(`${timestamp} ${chalk.white('DASHBOARD')} ${args}`));
    }

    static ready(args) {
        const timestamp = `[${moment().format("DD-MM-YYYY HH:mm:ss")}] :`;
        console.log(chalk.gray("—————————————————————————————————"));
        console.log(chalk.magenta.bold(`${timestamp} ${chalk.black.greenBright('READY')} ${args}`));
        console.log(chalk.gray("—————————————————————————————————"));
    }
    static info(args) {
        if (Log.checkIfArrayOrObject(args)) dump(args);
        else console.log(args);
    }

    static success(args) {
        if (Log.checkIfArrayOrObject(args)) dump(args);
        else console.log(chalk.green(args));
    }

    static warn(args) {
        if (Log.checkIfArrayOrObject(args)) dump(args);
        else console.log(chalk.yellow(args));
    }

    static error(args) {
        if (Log.checkIfArrayOrObject(args)) dump(args);
        else {
            const timestamp = `[${moment().format("DD-MM-YYYY HH:mm:ss")}] :`;
            console.log(chalk.red.bold(`${timestamp} ${chalk.white('ERROR')} ${args}`));
        }
    }

    static debug(args) {
        if (Log.checkIfArrayOrObject(args)) dump(args);
        else console.log(chalk.gray(args));
    }

    static checkIfArrayOrObject(thing) {
        return typeof thing === typeof [] || typeof thing === typeof {};
    }
}