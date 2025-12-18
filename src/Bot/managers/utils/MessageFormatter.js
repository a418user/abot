const { ButtonBuilder } = require('discord.js');

module.exports = class MessageFormatter {
    constructor (client) {
        this.client = client
        this.config = client.config
    }

    init() {
        const emojiSuccess = this.client.emojis.cache.get(this.config['system']['emojiSuccess']);
        const emojiError = this.client.emojis.cache.get(this.config['system']['emojiError']);

        if (emojiSuccess) {
            this.client.emojiSuccess = `<:${emojiSuccess.name}:${emojiSuccess.id}>`
        }
        else {
            this.client.emojiSuccess = '✅'
        }

        if (emojiError) {
            this.client.emojiError = `<:${emojiError.name}:${emojiError.id}>`
        }
        else {
            this.client.emojiError = '❌'
        }
    }

     /**
     * Format message with custom emote
     * @param {string} message The message
     * @param {string || null} prefix
     * @return {*}
     */
    custom (message, prefix = null) {
        return (prefix ? `${prefix} ` : '') + message
    }

     /**
     * Format message with success
     * @param {string} message The message
     * @return {*}
     */
    success (message) {
        return this.custom(message, this.client.emojiSuccess)
    }

     /**
     * Format message with error
     * @param {string} message The message
     * @return {*}
     */
    error (message) {
        return this.custom(message, this.client.emojiError)
    }

     /**
     * Get components to display question
     * @param {string} customIdSuccess The custom id for success
     * @param {string} emojiSuccess The emoji for success
     * @param {string} customIdError The custom id for error
     * @param {string} emojiError The emoji for error
     * @return {[{components: [{emoji, custom_id, style: number, type: number},{emoji, custom_id, style: number, type: number}], type: number}]}
     */
    question (customIdSuccess, emojiSuccess, customIdError, emojiError) {
        return [{
            type: 1,
            components: [{
                custom_id: customIdSuccess,
                style: 2,
                emoji: emojiSuccess,
                type: 2
            },
                {
                    custom_id: customIdError,
                    style: 2,
                    emoji: emojiError,
                    type: 2
                }]
        }]
    }

     /**
     * Get components to display pages
     * @param {string} customIdLeft The custom id for left page
     * @param {string} customIdMiddle The custom id for middle page
     * @param {string} customIdRight The custom id for right page
     * @param {string} label The label for middle page
     * @param {Number} page The current page
     * @param {Number} pages The number of total pages
     * @param {Boolean} off Disable the buttons
     * @return {[{components: [{emoji: string, custom_id, style: number, disabled: boolean, type: number},{custom_id, style: number, disabled: boolean, label, type: number},{emoji: string, custom_id, style: number, disabled: boolean, type: number}], type: number}]}
     */
    pages = (customIdLeft, customIdMiddle, customIdRight, label, page, pages, off = false) => {
        return [{
            type: 1,
            components: [{
                custom_id: customIdLeft,
                style: 2,
                emoji: '⬅️',
                type: 2,
                disabled: page === 1 || off
            },
                {
                    custom_id: customIdMiddle,
                    style: 3,
                    label: label,
                    type: 2,
                    disabled: true
                },
                {
                    custom_id: customIdRight,
                    style: 2,
                    emoji: '➡️',
                    type: 2,
                    disabled: page === pages || off
                }]
        }]
    }

     /**
     * Disable all components of a message
     * @param {Array} components The components
     * @return {Array}
     */
    disableButtons(components) {
        for (let x = 0; x < components.length; x++) {
            for (let y = 0; y < components[x].components.length; y++) {
                components[x].components[y] = ButtonBuilder.from(components[x].components[y]);
                components[x].components[y].setDisabled(true);
            }
        }
        return components;
    }

     /**
     * Enable all components of a message
     * @param {Array} components The components
     * @return {Array}
     */
    enableButtons(components) {
        for (let x = 0; x < components.length; x++) {
            for (let y = 0; y < components[x].components.length; y++) {
                components[x].components[y] = ButtonBuilder.from(components[x].components[y]);
                components[x].components[y].setDisabled(false);
            }
        }
        return components;
    }
}






