const fetch = require("node-fetch");

module.exports = class Functions {
    constructor(client) {
        this.client = client;
    }

     /**
     * Send data to our private hasteBin
     * @param {String} input - The data to send
     * @param {String} extensionGiven - The extension of the file
     * @param {String} urlGiven - The url of the hasteBin
     * @returns {Promise<String>} - The url of the file
     **/
    async hasteBin (input, extensionGiven, urlGiven) {

        const url = urlGiven ? urlGiven : "https://hastebin.com";
        const extension = extensionGiven ? extensionGiven : "txt";

        const res = await fetch(`${url}/documents`, {
            method: "POST",
            body: input,
            headers: { "Content-Type": "text/plain" }
        });

        if (!res.ok) throw new Error(res.statusText);

        const { key } = await res.json();

        return `${url}/${key}.${extension}`;
    }

     /**
     * Get a random number between to value
     * @param {Number} min - The min value
     * @param {Number} max - The max value
     * @returns {Number} - The random number
     * */
    randomNumber (min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min)
    }

     /**
     * Wait a specific time
     * @param {Number} ms - The time to wait
     * @returns {Promise} - The promise
     * */
    sleep (ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms)
        });
    }

     /**
     * Format number with space
     * @param {Number} x The number
     * @return {string}
     */
    numberWithSpaces(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }

     /**
     * Return the first letter in uppercase & the rest in lowercase
     * @param {String} string - The string to capitalize
     * @returns {String} - The string capitalized
     * */
    capitalize (string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

     /**
     * Send a string with the same length
     * @param {String} str - The string to send
     * @param {Number} length - The length of the string
     * @param {String} symbol - The symbol to use
     * @returns {String} - The string with the same length
     **/
    createPipedString(str, length, symbol) {
        return symbol + str + " ".repeat(length - str.length - 2) + symbol;
    }

     /**
     * Fetch messages of a channel
     * @param {Object} channel - The channel
     * @param {Boolean} reverseArray - Reverse the array
     * @param {Boolean} userOnly - Get only user messages
     * @param {Boolean} botOnly - Get only bot messages
     * @param {Boolean} pinnedOnly - Get only pinned messages
     * @returns {Promise<Array>} - The messages
     * */
    async fetchMessages (channel, reverseArray, userOnly, botOnly, pinnedOnly) {
        let messages = [];
        let lastID;
        while (true) {
            const fetchedMessages = await channel.messages.fetch({
                limit: 100,
                ...(lastID && { before: lastID }),
            });
            if (fetchedMessages.size === 0) {
                if (reverseArray) {messages = messages.reverse();}
                if (userOnly) {messages = messages.filter(msg => !msg.author.bot);}
                if (botOnly) {messages = messages.filter(msg => msg.author.bot);}
                if (pinnedOnly) {messages = messages.filter(msg => msg.pinned);}
                return messages;
            }
            messages = messages.concat(Array.from(fetchedMessages.values()));
            lastID = fetchedMessages.lastKey();
        }
    }

     /**
     * Get the date formatted
     * @param {Object} today - The date to format
     * @returns {String} - The date formatted
     */
    getToday (today) {
        const months = [`01`,`02`,`03`,`04`,`05`,`06`,`07`,`08`,`09`,`10`,`11`,`12`];
        return `${today.getDate()}/${months[today.getMonth()]}/${today.getFullYear()}`;
    }

     /**
     * Get packets of the data
     * @param {Array} data - The data
     * @param {Number} packetNumber - The number data per packets
     * @returns {Array} - The packets
     * */
    getNumberPacket (data, packetNumber) {
        const list = data.slice();
        const data_list = [];
        let perdList = [];
        const numberPerPage = packetNumber;
        const packet = Math.floor(data.length / numberPerPage);

        for (let x = 0; x < packet; x++) {
            for (let i = 0; i < numberPerPage; i++) {
                perdList.push(list.shift());
            }
            data_list.push(perdList);
            perdList = [];
        }

        perdList = [];
        for (const row of list) {
            perdList.push(row);
        }

        data_list.push(perdList);

        for (let j = 0; j < data_list.length; j++) {
            if (data_list[j].length === 0) {
                data_list.splice(j, 1);
            }
        }
        return data_list;
    }

     /**
     * Get the number emoji for the number selected
     * @param {Number} number - The number
     * @returns {String} - The emoji
     * */
    getNumEmoji(number) {
        const numEmoji = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
        return numEmoji[number];
    }

     /**
     * Get an array shuffled
     * @param {Array} array - The array to shuffle
     * @returns {Array} - The array shuffled
     * */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }

        return array;
    }

    /**
     * Create the poll progress bar
     * @param {Number} value - The value to fill the bar
     * @param {Number} maxValue - The max value of the bar
     * @param {Number} size - The bar size (in letters)
     * @return {String} - The bar
     */
    progressBarPoll (value, maxValue, size) {
        const percentage = value / maxValue; // Calculate the percentage of the bar
        const progress = Math.round((size * percentage)); // Calculate the number of square caracters to fill the progress side.
        const emptyProgress = size - progress; // Calculate the number of dash caracters to fill the empty progress side.
        const progressText = '⬜'.repeat(progress); // Repeat is creating a string with progress * caracters in it
        const emptyProgressText = '⬛'.repeat(emptyProgress); // Repeat is creating a string with empty progress * caracters in it
        const percentageText = Math.round(percentage * 100) + '%'; // Displaying the percentage of the bar

        return `${progressText}${emptyProgressText} | ${percentageText}`; // Creating the bar
    }

    /**
     * Get the number of XP it takes to reach a level
     * @param {number} [value] User's xp
     * @return {number}
     */
    getLevelWithXp (value) {
        // Level & Xp
        let level = 0
        let xp = 0

        // While the xp is less than the value
        do {
            level++
            xp = this.getXpWithLevel(level)
        } while (xp < value)

        // Return the level
        return level - 1
    }

    /**
     * Get the level with a specific number of XP
     * @param {number} [level] User's x
     * @return {number}
     */
    getXpWithLevel (level) {
        return (level * 300 * (level / 2.5))
    }
}
