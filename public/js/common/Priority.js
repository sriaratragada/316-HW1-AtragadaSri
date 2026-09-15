/**
 * Priority.js
 *
 * The three values a ListItem may have as its priority, in the order they appear
 * wherever the user is offered the choice.
 *
 * Dates have DateUtil; priorities have this. Both exist so that the strings
 * "High", "Medium" and "Low" are not scattered through a dozen files, and so that
 * anything unrecognized coming out of local storage becomes a sensible default
 * rather than a value the rest of the application has never heard of.
 */
export class Priority {
    static HIGH = 'High';
    static MEDIUM = 'Medium';
    static LOW = 'Low';
    static DEFAULT = Priority.LOW;

    /**
     * @return {string[]} High, Medium, Low — most urgent first
     */
    static values() {
        return [Priority.HIGH, Priority.MEDIUM, Priority.LOW];
    }

    /**
     * @param {*} value
     * @return {boolean} true if this is one of the three allowed priorities
     */
    static isValid(value) {
        return Priority.values().includes(value);
    }

    /**
     * Normalizes anything we might read out of local storage, or out of a form
     * control, into one of the three allowed values. Anything unrecognized
     * becomes Low.
     *
     * @param {*} value
     * @return {string}
     */
    static clean(value) {
        return Priority.isValid(value) ? value : Priority.DEFAULT;
    }

    /**
     * The CSS class stamped onto a card and its pill, i.e. "priority-high".
     * Unrecognized values fall back to Low, so a corrupted item still draws.
     *
     * @param {*} value
     * @return {string}
     */
    static cssClass(value) {
        return `priority-${Priority.clean(value).toLowerCase()}`;
    }
}
