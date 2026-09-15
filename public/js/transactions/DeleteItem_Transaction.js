/**
 * DeleteItem_Transaction.js
 *
 * Removes one item from the open list. Undo puts that very object back in the
 * position it came from, which is why doTransaction keeps whatever the model
 * handed back rather than rebuilding the item from its values.
 */
import { jsTPS_Transaction } from '../../lib/jsTPS.js';

export class DeleteItem_Transaction extends jsTPS_Transaction {
    #model;
    #index;
    #removed;

    /**
     * @param {WolfieListsModel} model
     * @param {number} index which item to delete
     */
    constructor(model, index) {
        super();
        this.#model = model;
        this.#index = index;
        this.#removed = null;
    }

    doTransaction() {
        this.#removed = this.#model.removeItemFromCurrentList(this.#index);
    }

    undoTransaction() {
        if (this.#removed === null) return;
        this.#model.addItemToCurrentList(this.#removed, this.#index);
    }

    toString() {
        return `DeleteItem_Transaction(index ${this.#index})`;
    }
}
